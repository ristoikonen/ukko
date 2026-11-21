# Oracle Cloud – Kaksi ilmaista virtuaalipalvelinta plus pysyva IP

> Muistiinpanot omasta pilviympäristöstä: kevyt testikone ja tehokkaampi ARM-palvelin. Saap halavalla !
## 1. Palvelimet

| Ominaisuus | Testikone | Varsinainen palvelin |
|---|---|---|
| Käyttötarkoitus | Kokeilut ja testaus | Verkkosivut, sovellukset ja kuvankäsittely |
| Muisti (RAM) | 1 Gt | 12 Gt |
| HD | 44 Gt | 44 Gt sama levy|
| Prosessori | 1 virtuaalinen CPU | 2 ARM OCPU -ydintä |
| Hinta | Always Free -rajoissa maksuton | Always Free -rajoissa maksuton |
| Rekisteröityminen | **Ilman** luottokorttia, riskiton aloitus! | Korttitiedot vaaditaan |

**ARM-prosessori:** Ampere Altra / ARM Neoverse N1. Sen suorituskykyä voi karkeasti verrata vanhempiin Intel Core i3 -suorittimiin, esimerkiksi i3-4130:een. Vertaus on suuntaa antava: nopeus riippuu tehtävästä, ohjelmistosta ja siitä, hyödynnetäänkö molempia ytimiä.

## 2. Ubuntu on kevyt palvelinkäyttöjärjestelmä

Palvelimessa on **Ubuntu Server 24.04 LTS**. Ilman graafista työpöytää Ubuntu tarvitsee huomattavasti vähemmän muistia ja levytilaa kuin tavallinen Windows 11 -asennus.

Palvelimella voi ajaa samanaikaisesti esimerkiksi:

- verkkopalvelinta ja omia sovelluksia
- hallintapaneelia ja valvontatyökaluja
- kuva- ja tiedostoselainta
- SSH- ja SFTP-palveluja

**Muistiinpanojen mukainen käyttö:**

| Resurssi | Käytössä |
|---|---:|
| Levytila | noin 4 Gt |
| RAM | noin 560 Mt |

Luvut kuvaavat yhtä mittaushetkeä, eivät käyttöjärjestelmän kiinteää kulutusta. Linux käyttää vapaata muistia myös välimuistina ja vapauttaa sitä tarvittaessa.

## 3. Pysyvä julkinen IP-osoite

**Esimerkkiosoite / muistiinpanoihin merkitty IP:** `159.13.37.13`

Eli kaytannossa ilmainen pysyva IP osoite!

### Pysyvän IP-osoitteen hyödyt

- **DNS:** verkkotunnus voidaan osoittaa pysyvään IP-osoitteeseen ilman jatkuvia DNS-muutoksia.
- **IP-osoitteiden sallintalistat (allowlisting):** palvelimen tunnettu IP voidaan sallia palomuureissa ja ulkoisissa palveluissa.
- **Palvelimen vaihto:** IP voidaan siirtää toiselle VM:lle esimerkiksi vikatilanteessa. Siirto ei ole automaattinen ilman erillistä toteutusta.
- **Useita palveluja:** sama julkinen IP voi palvella verkkosivustoa, hallintapaneelia, valvontaa ja kuvagalleriaa.
- **Helpompi ylläpito:** SSH-yhteyden kohde pysyy samana myös palvelinta vaihdettaessa.

## 4. Monta sovellusta yhdellä IP-osoitteella

Yhdellä palvelimella voi olla useita sovelluksia eri **sisäisissä porteissa**:

| Sovellus | Esimerkkiosoite palvelimen sisällä |
|---|---|
| Verkkosivusto | `127.0.0.1:3000` |
| Kuvien selaus- ja hallintasovellus | `127.0.0.1:8080` |
| Hallintapaneeli / valvonta | `127.0.0.1:9000` |

Suositeltava ratkaisu on käyttää **Caddy-käänteistä välityspalvelinta**, jolloin ulospäin tarvitaan tavallisesti vain HTTPS-portti **443** (ja portti **80** HTTPS-uudelleenohjausta sekä varmenteita varten):

```text
https://www.esimerkki.fi      → Caddy → localhost:3000
https://kuvat.esimerkki.fi    → Caddy → localhost:8080
https://hallinta.esimerkki.fi → Caddy → localhost:9000
```

Hallintapaneeli on syytä suojata kirjautumisella tai rajata pääsy vain ylläpitäjälle.

### Kolmannen osapuolen kuvasovelluksia

- **PhotoPrism:** [photoprism.app/features](https://www.photoprism.app/features) – valokuvakirjasto, selaus, haku ja organisointi.
- **Silex:** [silex.me](https://www.silex.me/) – verkkosivustojen rakentamiseen tarkoitettu työkalu, **ei varsinainen kuvakirjastosovellus**.

## 5. Ylläpito ja tiedostojen siirto Windowsista

Käytän **Windows Terminalia** SSH-yhteyteen. SSH:n avulla palvelinta voi hallita komentoriviltä:

```powershell
ssh ubuntu@PALVELIMEN_IP
```

Kuvia ja muita tiedostoja voi siirtää salatusti **SFTP:llä tai SCP:llä**. Molemmat käyttävät oletusarvoisesti **SSH-porttia 22** – erillistä FTP-porttia 21 ei tarvita.

```powershell
scp .\kuva.jpg ubuntu@PALVELIMEN_IP:/home/ubuntu/images/
```

Windows 11:ssä voi käyttää myös graafista tiedostonhallintasovellusta, joka tukee SFTP:tä, esimerkiksi **WinSCP:tä**. Windowsin oma Resurssienhallinta ei tarjoa suoraan vastaavaa yleiskäyttöistä SFTP-yhteyttä ilman lisäohjelmistoa.

## 6. Yhteenveto

Oracle Cloudin Always Free -resursseilla voi rakentaa käyttökelpoisen pienen palvelinympäristön: kevyt testikone ja erillinen 2-ytiminen, 12 Gt:n ARM-palvelin. Ubuntu jättää suuren osan muistista sovelluksille. Pysyvä IP, Caddy, SSH ja SFTP tekevät palvelujen julkaisemisesta ja ylläpidosta joustavaa.

**Huomio:** Maksuttomuus riippuu Oracle Cloudin ajantasaisista Always Free -ehdoista, käytetyistä resursseista ja tilin tyypistä. Budjettihälytys ei yksin estä veloituksia.
