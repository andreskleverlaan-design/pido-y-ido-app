# Pido y Ido — werkend prototype

Mobiele web-app (PWA) voor eten bestellen in Villanueva, Casanare. Spaanse interface.
Werkt op elke telefoon in de browser en kan op het beginscherm worden gezet als app.

Links:
- **Live:** https://andreskleverlaan-design.github.io/pido-y-ido-app/live/ (de hoofdlink zonder /live/ werkt ook en is hetzelfde)
- **Demo:** https://andreskleverlaan-design.github.io/pido-y-ido-app/demo/ (voorbeeldrestaurants, alles blijft op het eigen toestel)

De app heeft twee standen:
- **Demo** (als `config.js` leeg is, of met `?demo` achter het adres): alle gegevens blijven op het eigen toestel, met voorbeeldrestaurants.
- **Online** (als `config.js` de Supabase-gegevens heeft): een bestelling op de ene telefoon komt echt binnen bij het restaurant op een andere telefoon. Er wordt niets afgerekend in de app (contant / Nequi / Daviplata).

## Online stand (Supabase, gratis plan)
- `supabase/setup.sql`: alle tabellen, beveiliging en acties. Plak in Supabase > SQL Editor > Run (mag vaker).
- In Supabase > Authentication > Sign In / Providers: **Allow anonymous sign-ins** aan, en bij Email **Confirm email** uit.
- `config.js`: `supabaseUrl` (Project URL) en `supabaseKey` (publishable/anon key, die is openbaar bedoeld). Nooit de secret/service_role key gebruiken.

Hoe het werkt:
- **Klant:** hoeft geen account te maken; de telefoon krijgt automatisch een anoniem account. Ziet alleen de eigen bestellingen en de eigen 4-cijferige code.
- **Restaurant:** registreert met WhatsApp-nummer + zelfgekozen clave, zet zelf het menu in de app (tab Menú), zet Abierto aan. Nieuwe bestellingen komen binnen met geluid (scherm open laten). Ziet de code van de klant nooit.
- **Domiciliario:** krijgt het WhatsApp-bericht van het restaurant met een link; bij aflevering vult hij daar de code van de klant in (max. 5 pogingen). Het restaurant kan de code ook zelf invullen.
- **Prijzen** worden op de server uit het menu berekend, niet uit de telefoon van de klant.
- **Promotor:** krijgt automatisch een eigen code in de link; Ganancias toont de echte bestellingen via die link (zonder persoonsgegevens). Het percentage is nog een voorbeeld.

Nog niet: automatische WhatsApp-berichten vanaf één Pido y Ido-nummer (code staat klaar, zie hieronder), beheerscherm voor jou (gebruik voorlopig Supabase > Table Editor).

## Wat werkt
- **Start:** laadscherm (logo op groen) en keuzescherm "¿Cómo quieres usar Pido y Ido?" met 4 rollen; de gekozen rol wordt onthouden en kan via Perfil worden gewijzigd.
- **Cliente:** restaurants, categorieën, zoeken, menu, winkelmand, Domicilio/Recoger, adres + kaartpin, betalen met efectivo (met wisselgeld), Nequi of Daviplata, bestelstatus met 4-cijferige PIN, beoordelen, opnieuw bestellen.
- **Restaurante:** open/dicht, bestellingen accepteren (20/30/45 min) of weigeren, "Listo", eigen domiciliario kiezen of "Lo llevo yo", bestelling via WhatsApp (wa.me) naar de rider sturen, levering bevestigen met PIN, eigen riders opslaan/verwijderen, bolsa de domiciliarios.
- **Domiciliario:** profiel publiceren in de bolsa, WhatsApp-simulatie: "Voy en camino" en `ENTREGADO 1234` sluit de bestelling af.
- **Promotor:** echte QR-code en link per restaurant (scannen opent dat restaurant met de promotor-code), kopiëren, QR downloaden om te printen, delen via WhatsApp, verdiensten (voorbeeldbedragen + echte bestellingen via de link).

## Bestanden
Statische site, geen build nodig: `index.html`, `app.css`, `app.js`, `cloud.js` (koppeling met Supabase), `config.js`, `vendor/supabase.js` (MIT, supabase-js 2.117.3), `qrcode.js` (MIT, qrcode-generator 1.4.4), `sw.js` (offline), `manifest.webmanifest`, `icons/`, `supabase/setup.sql`.

Lokaal testen: `python3 -m http.server` in deze map en open http://localhost:8000.

Foto's worden geladen van Pexels/Unsplash (gratis licenties); vervang ze voor de lancering door eigen foto's van de restaurants.

## Tiendas (pedido libre)
Además de restaurantes, se pueden inscribir droguerías, minimercados, licoreras, floristerías, ferreterías y otros negocios.
Las tiendas no necesitan menú: el cliente escribe su lista o manda una foto, y la tienda pone el precio al aceptar.
Base de datos: pegar `supabase/004-tiendas.sql` en Supabase > SQL Editor (una vez).

## Pronto en Pido y Ido (negocios que aún no están)
Onder de echte zaken toont de klant-app een grijze lijst "Pronto en Pido y Ido" met echte zaken uit Villanueva die nog niet meedoen (uit `bedrijven-villanueva.xlsx`, zonder de rijen waarvan de plaats nog gecheckt moest worden, en zonder disco, ketens en de online bloemist). Alleen naam en soort, geen telefoon of foto's. Je kunt er niet bij bestellen; de klant kan de zaak via WhatsApp uitnodigen (link naar de inschrijving). Zodra een zaak zich met (ongeveer) dezelfde naam inschrijft, verdwijnt hij vanzelf uit de lijst. Elke zaak heeft een eigen pagina met deelbare link, bijv. `live/#/negocio/asadero-el-gran-ranchon` (uitnodigen, delen met buren, alternatieven, knop "¿Eres el dueño?" die de inschrijving voor-invult). Lijst aanpassen: `PRONTO` in `app.js`.
- **Teller "X personas ya pidieron que se una"**: op de pagina van elke nog-niet-aangesloten zaak. Een klik op "Yo también quiero pedir aquí", "Invitar" of "Compartir" telt één keer per telefoon. Database: `supabase/005-piden.sql` één keer plakken in Supabase > SQL Editor. In de demo zijn de getallen verzonnen.

## Klanten in de app houden (006)
Database: plak `supabase/006-clientes-fieles.sql` in Supabase > SQL Editor (eenmalig, mag vaker). Zonder deze stap werkt de app zoals voorheen.
- **Stempelkaart:** elke 5e bestelling via de app kost $2.000 minder (bij bestellingen vanaf $10.000, alleen restaurants met menu). 4 bezorgde bestellingen = 1 stempelkaart vol. Pido y Ido betaalt de korting: het restaurant ziet het bij de bestelling en het gaat van de commissie af. Bedrag aanpassen: `reward_state` in de SQL.
- **Nummer verborgen:** WhatsApp en Nequi van de zaak staan niet meer in de openbare tabel maar in `rest_contact` (alleen de eigenaar ziet ze). De klant ziet het Nequi-nummer pas als de zaak de bestelling heeft geaccepteerd, en het telefoonnummer alleen als de zaak zelf bezorgt en het onderweg is.
- **"Ya transferí":** de klant meldt de betaling in de app in plaats van het bewijs naar de WhatsApp van de zaak te sturen.
- **"Pedir lo mismo otra vez":** bestond al (Inicio > Pedir de nuevo > Repetir).

## WhatsApp-meldingen namens Pido y Ido (voorbereid, nog uit)
Code: `supabase/functions/avisos-whatsapp/index.ts` (Supabase Edge Function, WhatsApp Business Cloud API van Meta).
- Restaurant krijgt "nuevo pedido" vanaf het Pido y Ido-nummer. Klant krijgt "aceptado", "en camino" en "rechazado", alleen als die "Avísame por WhatsApp" heeft aangevinkt.
- Aanzetten: Meta-account + nummer + 4 sjablonen (namen en teksten staan bovenin het bestand), functie in Supabase zetten met de geheimen `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `AVISOS_SECRET`, een Database Webhook op tabel `orders` (Insert + Update) met header `x-pyi-secret`, en daarna in `config.js` `whatsappAvisos: true`.
- **Sugerir un negocio** (`#/sugerir`): klanten stellen een zaak voor die nog niet in de lijst staat (naam, soort, dorp, opmerking). Zichtbaar in de app zodra jij hem goedkeurt (Supabase > Table Editor > `pronto_suggest`, kolom `status` op `aprobado`) of zodra 3 verschillende mensen dezelfde zaak voorstellen. `rechazado` = nooit tonen. Max. 5 voorstellen per persoon per dag. Database: `supabase/006-sugerencias.sql`.
- **Meerdere dorpen**: naast Villanueva staan er 423 zaken uit 10 volgende dorpen in (`PRONTO2` in `app.js`, uit `bedrijven-volgende-10-dorpen.xlsx`, zonder La Rebaja). Boven de lijst kies je het dorp; de keuze wordt onthouden.
