# Kaksi ilmaista virtuaalipalvelinta plus pysyva IP numero =>
# Oracle Cloud Always Free VMs 

Oracle:lla on paras ilmainen nettikone. https://cloud.oracle.eu/. Minulla on kevyt testikone ja tehokkaampi ARM-palvelin. Saap halavalla !

> HUOM: Ilmainen domain nimi (jotakin.fi.eu.org) ja DNS serveri: https://nic.eu.org/arf/en/domain/new/
and https://desec.io/. Ilmainen webbiserveri ja osoite: www.mikan_kuvat.fi.eu.org !


## 1. Serverit

| Ominaisuus | Testikone (1CPU/1Gb) | Varsinainen palvelin (2CPU/12Gb)|
|---|---|---|
| Käyttötarkoitus | Kokeilut ja testaus | Verkkosivut, sovellukset ja kuvankäsittely |
| Muisti (RAM) | 1 Gt | 12 Gt |
| HD | 44 Gt | 44 Gt sama levy (MAX 200Gb)|
| Prosessori | 1 virtuaalinen AMD CPU | 2 ARM OCPU -ydintä |
| Hinta | Always Free -rajoissa maksuton | Always Free -rajoissa maksuton |
| Rekisteröityminen | **Ei tarvitse luottokorttia**, riskiton aloitus! | Korttitiedot vaaditaan |

**ARM-prosessori:** Ampere Altra / ARM Neoverse N1. Sen suorituskykyä voi karkeasti verrata vanhempiin Intel Core i3 -suorittimiin, esimerkiksi i3-4130:een. Vertaus on suuntaa antava: nopeus riippuu tehtävästä, ohjelmistosta ja siitä, hyödynnetäänkö molempia ytimiä.


> HUOM: PARHAITEN TILAA jos stockholm-1 ei anna konetta: us-ashburn-1,us-phoenix-1 ja eu-frankfurt-1.

## 2. Ubuntu on kevyt palvelinkäyttöjärjestelmä

Serverin OS on **Ubuntu Server 24.04 LTS**. Ubuntu tarvitsee huomattavasti vähemmän muistia ja levytilaa kuin Windows.

Palvelimella voi ajaa samanaikaisesti esimerkiksi:

- nettiserveri ja omia sovelluksia
- hallintapaneelia ja valvontatyökaluja
- kuva- ja tiedostoselainta
- SSH- ja SFTP-palveluja

**Mun taman hetken kaytannon kayttö, ubuntu OS, webbiserveri (Caddy), control panel (Cockpit) , ohjelmat; 'TinyToken' ja muuta => Kaytan 500Mb RAMia ja noin 4 Gt kovalevya**

## 3. Pysyvä julkinen IP-osoite

**Esimerkkiosoite / muistiinpanoihin merkitty IP:** `159.13.37.13`

Eli kaytannossa ilmainen pysyva IP osoite!

### Pysyvän IP-osoitteen hyödyt

- **DNS:** verkkotunnus voidaan osoittaa pysyvään IP-osoitteeseen ilman jatkuvia DNS-muutoksia. Osta joku Domaini-nimi 5 euroa vuodessa, ks
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

Suositeltava ratkaisu on käyttää **Caddy-nettiserveri**, jolloin  tarvitaan vain HTTPS-porttit **443** ja portti **80** :

```text
https://www.esimerkki.fi      → Caddy → localhost:3000
https://kuvat.esimerkki.fi    → Caddy → localhost:8080
https://hallinta.esimerkki.fi → Caddy → localhost:9000
```

### Kolmannen osapuolen kuvasovelluksia Linuxille

- **PhotoPrism:** [photoprism.app/features](https://www.photoprism.app/features) – valokuvakirjasto, haku ja organisointi.
- **Silex:** [silex.me](https://www.silex.me/) – verkkosivustojen rakentaminen.

## 5. Ylläpito ja tiedostojen siirto Windowsista

Käytän **Windows Terminalia** SSH-yhteyteen. SSH:n avulla palvelinta voi hallita komentoriviltä:

```powershell
ssh ubuntu@PALVELIMEN_IP
```

Kuvia ja muita tiedostoja voi siirtää ***HELPOSTI*** ja salatusti **SFTP:llä**, esimerkiksi **WinSCP** ohjelmalla. 

## 6. Yhteenveto

Oracle Cloudin Always Free -resursseilla voi rakentaa käyttökelpoisen pienen palvelinympäristön: kevyt testikone ja erillinen 2-ytiminen, 12 Gt:n ARM-palvelin. Ubuntu jättää suuren osan muistista sovelluksille. Pysyvä IP, Caddy, SSH ja SFTP tekevät palvelujen julkaisemisesta ja ylläpidosta joustavaa.

**Huomio:** Maksuttomuus riippuu Oracle Cloudin ajantasaisista Always Free -ehdoista, käytetyistä resursseista ja tilin tyypistä. Budjettihälytys ei yksin estä veloituksia.


## VIRTUAALINEN NETTIKONE ON YLLTTAVAN KIVA: EI MAKSA MITAAN, OLET AIDOSTI ADMIN
## JA AI AUTTAA!