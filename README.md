# Pido y Ido — werkend prototype

Mobiele web-app (PWA) voor eten bestellen in Villanueva, Casanare. Spaanse interface.
Werkt op elke telefoon in de browser en kan op het beginscherm worden gezet als app.

**Let op:** dit is een demo. Alle gegevens blijven op het eigen toestel (localStorage), er is geen server en er wordt niets afgerekend.

## Wat werkt
- **Start:** laadscherm (logo op groen) en keuzescherm "¿Cómo quieres usar Pido y Ido?" met 4 rollen; de gekozen rol wordt onthouden en kan via Perfil worden gewijzigd.
- **Cliente:** restaurants, categorieën, zoeken, menu, winkelmand, Domicilio/Recoger, adres + kaartpin, betalen met efectivo (met wisselgeld), Nequi of Daviplata, bestelstatus met 4-cijferige PIN, beoordelen, opnieuw bestellen.
- **Restaurante:** open/dicht, bestellingen accepteren (20/30/45 min) of weigeren, "Listo", eigen domiciliario kiezen of "Lo llevo yo", bestelling via WhatsApp (wa.me) naar de rider sturen, levering bevestigen met PIN, eigen riders opslaan/verwijderen, bolsa de domiciliarios.
- **Domiciliario:** profiel publiceren in de bolsa, WhatsApp-simulatie: "Voy en camino" en `ENTREGADO 1234` sluit de bestelling af.
- **Promotor:** echte QR-code en link per restaurant (scannen opent dat restaurant met de promotor-code), kopiëren, QR downloaden om te printen, delen via WhatsApp, verdiensten (voorbeeldbedragen + echte bestellingen via de link).

## Bestanden
Statische site, geen build nodig: `index.html`, `app.css`, `app.js`, `qrcode.js` (MIT, qrcode-generator 1.4.4), `sw.js` (offline), `manifest.webmanifest`, `icons/`.

Lokaal testen: `python3 -m http.server` in deze map en open http://localhost:8000.

Foto's worden geladen van Pexels/Unsplash (gratis licenties); vervang ze voor de lancering door eigen foto's van de restaurants.
