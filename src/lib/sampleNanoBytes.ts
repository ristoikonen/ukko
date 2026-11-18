/**
 * Embedded 512-byte sample nanotoken extracted from data/tok_01838_hector2.png.token
 * Conforms to Nanotoken Specification V1 Candidate 1.
 */
const B64_SAMPLE =
  "TkFOTwEAAgDFAq0BgAEgAAEAAQCGQf1qwlD1eB0/Hxz0Lzz4p8Bmom/E7RTpY4CVfgb2uPP9gMKu7Llbar+7zX5+SUlKSkpKSkpJSUMYEuh+fklJSkpKSkl+GUl+fhLhfn5JSUpKSkoSgIDofhgS4X5+SUlKSkpKsQsL4RkYEuF+fklJSkpKSrA8PAt96OfhfkNJSkpKSX6wCzwLt+jh4X5DSUpKSn4S2uEL4eES4eF+Q0lKSkp+GAs1PBLo6OfhfkNJSkpKfkMLCzY8E0ro4X5+Q0lKSn5D4QsLPEpKQ+F+fn5JSkpDEbALCxhJGOfhQ35+SUpKEgra2gsLEhjn4UN+fn5KQuAKCgsLCxER5+F+Ehh+QwoKCuA7PAsLCufh4eESfhELCwsLCzwLCwvh4doLEugLEQsRERELCxEL2uHFxLK1EH2A5p6t98XpCEn8F/eMgbdqweRYnqXiXpP7UMSbymjxQrNKsPI4QA/KmWbjm/t1tO6ZxVSQsSUzIyr5a9qrjkhHQDtO1ThgiwPy4MoDKMI9V/7Sjw2VYUdNuQpa9QVmPkwlj5CioFG350enKs7uMmxHbmdnZ2ATWe0PmXekfhvH67ZPldhea25/21U1HM+uPJdspIyRfTuj0mWaU5NEnCJo37A1yHqcN4Hw1yv4dR2CtpNG1aEspj/pPaw=";

export interface ParsedNanoToken {
  magic: string;
  version: number;
  modelId: number;
  origWidth: number;
  origHeight: number;
  embeddingBytes: number;
  parityBytes: number;
  sourceFormat: number;
  pointerType: number;
  flags: number;
  utcTimestamp: number;
  headerCrc32: number;
  payloadCrc32: number;
  targetPointerHex: string;
  bytes: Uint8Array;
}

export function parseNanoToken(bytes: Uint8Array): ParsedNanoToken {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
  const version = view.getUint16(4, true);
  const modelId = view.getUint16(6, true);
  const origWidth = view.getUint16(8, true);
  const origHeight = view.getUint16(10, true);
  const embeddingBytes = view.getUint16(12, true);
  const parityBytes = view.getUint16(14, true);
  const sourceFormat = bytes[16] ?? 1;
  const pointerType = bytes[17] ?? 0;
  const flags = view.getUint16(18, true);
  const utcTimestamp = view.getUint32(20, true);
  const headerCrc32 = view.getUint32(24, true);
  const payloadCrc32 = view.getUint32(28, true);
  const targetPointerHex = Array.from(bytes.slice(32, 64))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    magic,
    version,
    modelId,
    origWidth,
    origHeight,
    embeddingBytes,
    parityBytes,
    sourceFormat,
    pointerType,
    flags,
    utcTimestamp,
    headerCrc32,
    payloadCrc32,
    targetPointerHex,
    bytes,
  };
}

export function getSampleNanoBytes(): Uint8Array {
  const binary = atob(B64_SAMPLE);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
