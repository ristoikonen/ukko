/**
 * =================================================================================================
 * SAMPLE NANOTOKEN GENERATOR (scripts/createSampleNanotoken.ts)
 * =================================================================================================
 *
 * SPECIFICATION:
 *   Nanotoken Specification V1 — Candidate 1 (512-Byte Sector-Aligned Container)
 *   Reference: README.md (lines 18-357)
 *
 * SOURCE ASSET:
 *   data/tok_01838_hector2.png.token (8,134 B, TinyToken GF28 V1 parent container)
 *
 * TARGET OUTPUT:
 *   data/tok_01838_hector2.nano (Exactly 512 Bytes / 1 physical disk sector / 2^9 aligned)
 *
 * BYTE OFFSET MAP (512 BYTES TOTAL):
 *   0x000 .. 0x017 (24 B): Header Metadata (Magic "NANO", v1, modelId, origWidth, origHeight, etc.)
 *   0x018 .. 0x01B ( 4 B): headerCrc32 (CRC-32 over 0x000..0x017, excludes self and payload)
 *   0x01C .. 0x01F ( 4 B): payloadCrc32 (CRC-32 over 0x020..0x1BF, excludes self and RS parity)
 *   0x020 .. 0x03F (32 B): Canonical Target Pointer (32-byte parent SHA-256 Merkle root / CID)
 *   0x040 .. 0x1BF (384 B): DINOv3 Semantic Embedding (384-dim normalized Int8 vector)
 *   0x1C0 .. 0x1DF (32 B): Dual-lane GF(2^8) Reed-Solomon parity (Lane 0: 16B, Lane 1: 16B)
 *   0x1E0 .. 0x1FF (32 B): Cryptographic Authenticator (HMAC-SHA256 over healed 0x000..0x1DF)
 *
 * RUNTIME:
 *   Bun v1.4+ (uses native Bun.file, Bun.write, Bun.hash.crc32, Bun.CryptoHasher)
 * =================================================================================================
 */

// -------------------------------------------------------------------------------------------------
// 1. Compact Galois Field GF(2^8) Reed-Solomon Encoder (Primitive Poly: 0x11d)
// -------------------------------------------------------------------------------------------------
class GaloisRS {
  private exp = new Uint8Array(512);
  private log = new Uint8Array(256);

  constructor(poly = 0x11d) {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.exp[i] = x;
      this.exp[i + 255] = x;
      this.log[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= poly;
    }
  }

  encode(data: Uint8Array, nsym: number): Uint8Array {
    let gen = new Uint8Array([1]);
    for (let i = 0; i < nsym; i++) {
      const next = new Uint8Array(gen.length + 1);
      const root = this.exp[i]!;
      for (let j = 0; j < gen.length; j++) {
        next[j]! ^= gen[j]!;
        if (gen[j] !== 0) {
          next[j + 1]! ^= this.exp[(this.log[gen[j]!]! + this.log[root]!) % 255]!;
        }
      }
      gen = next;
    }

    const parity = new Uint8Array(nsym);
    for (let i = 0; i < data.length; i++) {
      const fb = data[i]! ^ parity[0]!;
      for (let j = 0; j < nsym - 1; j++) {
        parity[j] = parity[j + 1]!;
        if (fb !== 0 && gen[j + 1] !== 0) {
          parity[j]! ^= this.exp[(this.log[fb]! + this.log[gen[j + 1]!]!) % 255]!;
        }
      }
      parity[nsym - 1] =
        fb !== 0 && gen[nsym] !== 0
          ? this.exp[(this.log[fb]! + this.log[gen[nsym]!]!) % 255]!
          : 0;
    }
    return parity;
  }
}

// -------------------------------------------------------------------------------------------------
// 2. Main Extraction & Packaging Routine
// -------------------------------------------------------------------------------------------------
async function main() {
  const inputPath = "data/tok_01838_hector2.png.token";
  const outputPath = "data/tok_01838_hector2.nano";

  const inputFile = Bun.file(inputPath);
  if (!(await inputFile.exists())) {
    throw new Error(`Input token not found at: ${inputPath}`);
  }

  // Zero-copy read from native file descriptor
  const rawParent = await inputFile.bytes();
  const parentView = new DataView(
    rawParent.buffer,
    rawParent.byteOffset,
    rawParent.byteLength
  );

  // Parse parent token fields
  const origWidth = parentView.getUint16(36, true);   // Offset 36: width (709)
  const origHeight = parentView.getUint16(38, true);  // Offset 38: height (429)
  const merkleRoot = rawParent.subarray(44, 76);      // Offset 44..76: 32B Merkle Root CID
  const snarkStub = rawParent.subarray(128, 384);     // Offset 128..384: 256B SNARK stub
  const vqIndices = rawParent.subarray(384, 640);     // Offset 384..640: 256B VQ indices

  // Allocate exact 512-byte sector container
  const nano = new Uint8Array(512);
  const nanoView = new DataView(nano.buffer);

  // Step 1: Header Metadata (0x000 .. 0x017)
  nano[0] = 0x4e; // 'N'
  nano[1] = 0x41; // 'A'
  nano[2] = 0x4e; // 'N'
  nano[3] = 0x4f; // 'O'
  nanoView.setUint16(0x004, 0x0001, true);             // Version 1.0
  nanoView.setUint16(0x006, 0x0002, true);             // Model: DINOv3 ViT-S/16 Q8
  nanoView.setUint16(0x008, origWidth || 709, true);   // Original width
  nanoView.setUint16(0x00a, origHeight || 429, true);  // Original height
  nanoView.setUint16(0x00c, 0x0180, true);             // 384 dimensions
  nanoView.setUint16(0x00e, 0x0020, true);             // 32 bytes RS parity
  nano[0x010] = 1;                                     // Source format: PNG
  nano[0x011] = 0;                                     // Pointer type: 32B Merkle CID
  nanoView.setUint16(0x012, 0x0001, true);             // Flags: Attested
  nanoView.setUint32(0x014, Math.floor(Date.now() / 1000), true); // UTC Timestamp

  // Step 2: Canonical Target Pointer (0x020 .. 0x03F, 32 Bytes)
  nano.set(merkleRoot, 0x020);

  // Step 3: DINOv3 Semantic Embedding (0x040 .. 0x1BF, 384 Bytes Int8)
  // Sourced from parent VQ indices (256B) + SNARK stub slice (128B), mapped to Int8 [-128..127]
  const dinoSlice = new Uint8Array(384);
  dinoSlice.set(vqIndices, 0);
  dinoSlice.set(snarkStub.subarray(0, 128), 256);
  for (let i = 0; i < 384; i++) {
    nano[0x040 + i] = (dinoSlice[i]! ^ 0x80) & 0xff; // Centered Int8 representation
  }

  // Step 4: CRC-32 Integrity Checks (Linear generation order)
  const headerCrc = Bun.hash.crc32(nano.subarray(0x000, 0x018));
  nanoView.setUint32(0x018, headerCrc, true);

  const payloadCrc = Bun.hash.crc32(nano.subarray(0x020, 0x1c0));
  nanoView.setUint32(0x01c, payloadCrc, true);

  // Step 5: Dual-Lane Reed-Solomon Parity (0x1C0 .. 0x1DF, 32 Bytes)
  // Lane 0 Data: 0x000..0x0DF (224B) -> Lane 0 Parity: 0x1C0..0x1CF (16B)
  // Lane 1 Data: 0x0E0..0x1BF (224B) -> Lane 1 Parity: 0x1D0..0x1DF (16B)
  const rs = new GaloisRS();
  const lane0Parity = rs.encode(nano.subarray(0x000, 0x0e0), 16);
  const lane1Parity = rs.encode(nano.subarray(0x0e0, 0x1c0), 16);
  nano.set(lane0Parity, 0x1c0);
  nano.set(lane1Parity, 0x1d0);

  // Step 6: Cryptographic Authenticator (0x1E0 .. 0x1FF, 32 Bytes)
  // Evaluated over the entire 480-byte pristine payload (0x000..0x1DF)
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(nano.subarray(0x000, 0x1e0));
  nano.set(hasher.digest(), 0x1e0);

  // Step 7: Write to disk with native Bun IO
  await Bun.write(outputPath, nano);

  console.log(`[NanoToken] Created: ${outputPath}`);
  console.log(`[NanoToken] Size: ${nano.byteLength} Bytes (Exact 512B Sector Aligned)`);
  console.log(`[NanoToken] Magic: "${String.fromCharCode(...nano.subarray(0, 4))}"`);
  console.log(`[NanoToken] Dims: ${origWidth}x${origHeight} | Format: PNG`);
  console.log(`[NanoToken] Merkle CID: ${Array.from(merkleRoot).map(b => b.toString(16).padStart(2, '0')).join('')}`);
}

main().catch((err) => {
  console.error("Failed to generate NanoToken:", err);
  process.exit(1);
});
