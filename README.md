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

Nog niet: automatische WhatsApp-berichten vanaf één Pido y Ido-nummer, eigen foto's uploaden, beheerscherm voor jou (gebruik voorlopig Supabase > Table Editor).

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
