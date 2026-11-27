/* Pido y Ido — prototipo funcional (datos de demo guardados en este celular) */
(function () {
  'use strict';
  var BASE = ((document.currentScript && document.currentScript.src) || '').replace(/app\.js[^/]*$/, '');
  var CLOUD = window.PYI_CLOUD || null;
  var ONLINE = !!CLOUD;

  // ---------- Helpers ----------
  var PX = function (id, w) { return 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=' + (w || 500); };
  var US = function (id, w) { return 'https://images.unsplash.com/photo-' + id + '?w=' + (w || 500) + '&q=70&auto=format&fit=crop'; };
  // Free-licence stock photos (Pexels / Unsplash licence: free to use, no attribution needed).
  // Swap for the restaurants' own photos: they can upload them in Menú.
  var IMG = {
    asado: PX(31917730, 900),   // Pexels 31917730 "Traditional Argentine asado grilled steak" (Raul Corrado)
    carne: PX(18299599),        // Pexels 18299599 "Grilled meat on the barbecue"
    parrilla: PX(4294500, 900), // Pexels 4294500 "Roasting meat and sausages on barbecue grid"
    pollo: PX(6163330),         // Pexels 6163330 "Roasted chicken on a white plate" (Maksim Goncharenok)
    emp: PX(12263158),          // Pexels 12263158 "Close up of empanadas on plate"
    arepa: PX(29496090),
    almuerzo: PX(29450678),     // Pexels 29450678 "Delicious Latin American cuisine"
    pescado: PX(16931505),      // Pexels 16931505 "Fried fish with salad on plate"
    burger: PX(3356409),        // Pexels 3356409 "Hamburger and fries" (Engin Akyurt)
    pizza: US('1574071318508-1cdbab80d002'), pizza2: US('1513104890138-7c749659a591', 900),
    jugo: US('1546173159-315724a31696'), pincho: US('1555939594-58d7cb561ad1', 900),
    moto: PX(7362948, 1000)     // Pexels 7362948 "Man with food delivery bag riding a motorcycle"
  };
  // Photos that restaurants may already have saved in the database: show the better replacement.
  var IMG_OLD = { '14515096': 'asado', '6535195': 'emp', '1558030006-450675393462': 'carne', '1598103442097-8b74394b95c6': 'pollo', '1568901346375-23c9450c58cd': 'burger' };
  var IMG_ESC_ASADO, IMG_ESC_MOTO; // set after esc() exists
  function imgSrc(src, w) {
    src = String(src || '');
    var m = src.match(/photos\/(\d+)\/|photo-([\w-]+)\?/);
    var k = m && IMG_OLD[m[1] || m[2]]; if (k) src = IMG[k];
    if (w && /^https:\/\/images\.(pexels|unsplash)\.com\//.test(src)) src = src.replace(/([?&])w=\d+/, '$1w=' + w);
    return src;
  }
  function fmt(n) { return '$' + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function now() { return Date.now(); }
  IMG_ESC_ASADO = esc(imgSrc(IMG.asado, 900)); IMG_ESC_MOTO = esc(imgSrc(IMG.moto, 900));
  function ago(t) {
    var m = Math.floor((now() - t) / 60000);
    if (m < 1) return 'hace un momento';
    if (m < 60) return 'hace ' + m + ' min';
    var h = Math.floor(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    return 'hace ' + Math.floor(h / 24) + ' d';
  }
  function hora(t) {
    var d = new Date(t), h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? 'p. m.' : 'a. m.'; h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }
  // ---------- Hora de Colombia (UTC-5, sin horario de verano) y pedidos programados ----------
  var CO_OFF = 5 * 3600000;
  function coDay(t) { return Math.floor((t - CO_OFF) / 86400000); }
  function horaCo(t) {
    var d = new Date(t - CO_OFF), h = d.getUTCHours(), m = d.getUTCMinutes();
    var ap = h >= 12 ? 'p. m.' : 'a. m.'; h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }
  function aLasCo(t) { return (horaCo(t).indexOf('1:') === 0 ? 'a la ' : 'a las ') + horaCo(t); }
  function diaCo(t) { var d = coDay(t) - coDay(Date.now()); return d === 0 ? 'hoy' : d === 1 ? 'mañana' : d === -1 ? 'ayer' : 'el ' + ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date(t - CO_OFF).getUTCDay()]; }
  function cuandoCo(t) { return diaCo(t) + ' ' + aLasCo(t); }
  function capi(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function hm(s) { var p = String(s || '0:0').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function hmTxt(s) { return horaCo(CO_OFF + hm(s) * 60000); }
  function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); }
  function phoneFmt(p) { p = String(p || '').replace(/\D/g, ''); return p.length === 10 ? p.slice(0, 3) + ' ' + p.slice(3, 6) + ' ' + p.slice(6) : p.length > 10 ? '+' + p : p; }
  function waLink(phone, text) { var p = String(phone || '').replace(/\D/g, ''); if (p.length === 10) p = '57' + p; return 'https://wa.me/' + p + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function randPin() { return String(Math.floor(1000 + Math.random() * 9000)); }
  function first(name) { return String(name || '').split(' ')[0]; }
  function callName(name) { return /^(don|doña|dona)\s/i.test(String(name || '')) ? String(name).split(' ').slice(0, 2).join(' ') : first(name); }
  function isToday(t) { var a = new Date(t), b = new Date(); return a.toDateString() === b.toDateString(); }
  var AV = [['#FFE9DE', '#B9440F'], ['#E3EFE8', '#1F4D3A'], ['#EAE6F5', '#4A3C7A'], ['#E4EEF8', '#24507A'], ['#FFF1E0', '#8A4A00']];
  function avColor(id) { var s = 0; String(id).split('').forEach(function (c) { s += c.charCodeAt(0); }); return AV[s % AV.length]; }

  // ---------- Icons (Lucide style) ----------
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/>',
    bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>',
    store: '<path d="M3 9 4.5 4h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8"/><path d="M10 21v-5h4v5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    swap: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
    install: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01M12 6v7M9 10l3 3 3-3"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 11 5 12 8c1-3 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    camplus: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><path d="M12 10v6M9 13h6"/>',
    utensils: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/>',
    basket: '<path d="m15 11-1 9M19 11l-4-7M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7M9 11l1 9"/>',
    wine: '<path d="M8 22h8M7 10h10M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5z"/>',
    flower: '<circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
        fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.4 1.5 1.7 2.8 3.5 2.8z"/>'
  };
  function ic(name, size, opts) {
    opts = opts || {};
    var fill = opts.fill ? 'fill="currentColor"' : 'fill="none"';
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" ' + fill + ' stroke="currentColor" stroke-width="' + (opts.sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[name] + '</svg>';
  }
  // Logo "P met stip" (2a): kind = 'mark' (green P, light bg) | 'white' (dark bg) | 'icon' (green rounded square)
  function logo(size, kind) {
    kind = kind || 'mark';
    if (kind === 'icon') return '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-label="Pido y Ido"><rect width="100" height="100" rx="24" fill="#1F4D3A"/><path d="M38 80V45a18 18 0 1 1 13 17.4" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><circle cx="62" cy="63" r="7" fill="#FF6B2C"/></svg>';
    return '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-label="Pido y Ido"><path d="M36 84V45a20 20 0 1 1 14 19.2" fill="none" stroke="' + (kind === 'white' ? '#fff' : '#1F4D3A') + '" stroke-width="11" stroke-linecap="round"/><circle cx="63" cy="65" r="8" fill="#FF6B2C"/></svg>';
  }
  // w = wanted width in px for the photo service (thumbs small, heroes big; phones are ~2x)
  function photo(src, cls, style, w) {
    if (!w) w = /thumb/.test(cls || '') ? 200 : (style && /width:100%|inset:0/.test(style)) ? 900 : 400;
    return '<div class="ph ' + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '><span class="ph-ico">' + ic('fire', 26) + '</span>' + (src ? '<img src="' + esc(imgSrc(src, w)) + '" alt="" loading="lazy" decoding="async" onload="this.classList.add(\'in\')" onerror="this.classList.add(\'broken\')">' : '') + '</div>';
  }

  // ---------- Kinds of business ----------
  // Restaurants sell from a menu. Every other kind gets a free order: the customer types a list or sends a photo,
  // and the shop sets the price when it accepts.
  var KINDS = [
    { id: 'restaurante', t: 'Restaurante', icon: 'utensils', ex: 'Asadero El Llanero', sub: 'Carne a la llanera · Pollo asado' },
    { id: 'drogueria', t: 'Droguería', icon: 'pill', ex: 'Droguería La Salud', sub: 'Medicamentos · Aseo personal · Bebés', ph: 'Ej.:\nAcetaminofén 500 mg x 10\nSuero oral x 2\nPañales etapa 3', hint: '¿Tienes fórmula médica? Mándale la foto. La droguería decide si te lo puede vender.' },
    { id: 'minimercado', t: 'Minimercado', icon: 'basket', ex: 'Minimercado El Ahorro', sub: 'Mercado · Aseo · Bebidas', ph: 'Ej.:\nArroz Diana 1 kg\n6 huevos\nLeche Alquería x 2\nPan tajado' },
    { id: 'licorera', t: 'Licorera', icon: 'wine', ex: 'Licorera La 10', sub: 'Cerveza · Aguardiente · Hielo', ph: 'Ej.:\n6 cervezas Águila\nAguardiente Llanero media\n1 bolsa de hielo', hint: 'Solo para mayores de 18 años. Te pueden pedir la cédula al entregar.' },
    { id: 'floristeria', t: 'Floristería', icon: 'flower', ex: 'Floristería Las Rosas', sub: 'Ramos · Arreglos · Detalles', ph: 'Ej.:\nRamo de 12 rosas rojas\nTarjeta: "Feliz cumpleaños, mamá"\nPara las 4 p. m.' },
    { id: 'ferreteria', t: 'Ferretería', icon: 'wrench', ex: 'Ferretería El Tornillo', sub: 'Herramientas · Eléctricos · Plomería', ph: 'Ej.:\nTubo PVC 1/2" x 3 m\n2 codos de 1/2"\nCinta teflón', hint: 'Si no sabes el nombre, mándale una foto de la pieza.' },
    { id: 'otro', t: 'Otro negocio', icon: 'store', ex: 'Papelería La Esquina', sub: 'Qué vendes, en corto', ph: 'Escribe lo que necesitas, uno por línea.' }
  ];
  function kindOf(r) { var k = (r && r.kind) || 'restaurante'; for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === k) return KINDS[i]; return KINDS[KINDS.length - 1]; }
  // Secciones del menú (platos, adicionales, bebidas…). Platos viejos sin sección se adivinan por el nombre.
  var SECS = ['Platos', 'Entradas', 'Combos', 'Adicionales', 'Bebidas', 'Postres'];
  function secOf(d) {
    if (d.sec && SECS.indexOf(d.sec) >= 0) return d.sec;
    var n = String(d.name || '').toLowerCase();
    if (/jugo|gaseosa|limonada|cerveza|agua |agua$|bebida|coca|pony|malteada|caf[eé]|tinto|t[eé] |avena|chicha|refresco|batido|milo/.test(n)) return 'Bebidas';
    if (/postre|helado|torta|flan|brownie|tres leches|arroz con leche|cuajada con/.test(n)) return 'Postres';
    if (/adicional|porci[oó]n de|extra |salsa|^papas$/.test(n)) return 'Adicionales';
    if (/combo/.test(n)) return 'Combos';
    return 'Platos';
  }
  function secChips(cur, action, did) { return SECS.map(function (x) { return '<button class="chip sm' + (x === cur ? ' on' : '') + '" data-a="' + action + '" data-v="' + x + '"' + (did ? ' data-d="' + esc(did) + '"' : '') + '>' + x + '</button>'; }).join(''); }
  function menuSecs(dishes) { return SECS.map(function (s) { return { t: s, list: dishes.filter(function (d) { return secOf(d) === s; }) }; }).filter(function (x) { return x.list.length; }); }
  function isShop(r) { return !!r && !!r.kind && r.kind !== 'restaurante'; }
  function abreDe(r) { return (r && r.abre) || (isShop(r) ? '08:00' : '11:00'); }
  function cierraDe(r) { return (r && r.cierra) || (isShop(r) ? '20:00' : '21:00'); }
  // ---------- Horario por día (r.horario = 7 días desde el domingo; cada día ['11:00','21:00'] o null = cerrado) ----------
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function dowCo(t) { return new Date(t - CO_OFF).getUTCDay(); }
  function minCo(t) { var d = new Date(t - CO_OFF); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  function diaHoras(r, dow) { return r && r.horario ? (r.horario[dow] || null) : [abreDe(r), cierraDe(r)]; }
  function rangoTxt(d) { return d ? hmTxt(d[0]) + ' – ' + hmTxt(d[1]) : 'Cerrado'; }
  function horarioTxt(r, dow) { var d = diaHoras(r, dow == null ? dowCo(now()) : dow); return d ? rangoTxt(d) : 'cerrado ese día'; }
  // Dentro del horario ahora (sin horario puesto: siempre, como antes, solo cuenta el botón Abierto/Cerrado).
  function enHorario(r, t) { if (!r || !r.horario) return true; var d = diaHoras(r, dowCo(t)), m = minCo(t); return !!d && m >= hm(d[0]) && m < hm(d[1]); }
  function abierto(r) { return !!r && !!S.open[r.id] && enHorario(r, now()); }
  // Próxima vez que abre (hoy más tarde, mañana, o el día que toque), o null.
  function proxAbre(r) {
    if (!r || !r.horario) return null;
    for (var k = 0; k < 8; k++) {
      var day = coDay(now()) + k, d = diaHoras(r, new Date(day * 86400000).getUTCDay());
      if (d) { var t = day * 86400000 + CO_OFF + hm(d[0]) * 60000; if (t > now()) return t; }
    }
    return null;
  }
  // Lo que ve el cliente: "Abierto hasta las 9:00 p. m." / "Cerrado · abre mañana a las 11:00 a. m."
  function estadoTxt(r) {
    if (!r.horario) return abierto(r) ? 'Abierto' : 'Cerrado ahora';
    if (abierto(r)) return 'Abierto hasta ' + (hm(diaHoras(r, dowCo(now()))[1]) >= 13 * 60 ? 'las ' : 'la ') + hmTxt(diaHoras(r, dowCo(now()))[1]);
    var t = S.open[r.id] ? proxAbre(r) : null;
    return t ? 'Cerrado · abre ' + cuandoCo(t) : 'Cerrado ahora';
  }
  function punto(t) { return /\.$/.test(t) ? t : t + '.'; }
  // Semana completa, empezando el lunes, para mostrar en la página del negocio.
  function semanaHtml(r) {
    var hoy = dowCo(now());
    return '<div class="hor-week">' + [1, 2, 3, 4, 5, 6, 0].map(function (i) {
      return '<div class="row between' + (i === hoy ? ' b' : '') + '"><span>' + capi(DIAS[i]) + (i === hoy ? ' (hoy)' : '') + '</span><span' + (diaHoras(r, i) ? '' : ' class="muted"') + '>' + rangoTxt(diaHoras(r, i)) + '</span></div>';
    }).join('') + '</div>';
  }
  // Línea de horario en la página del negocio; con horario por día se abre la semana completa.
  function horarioLine(r) {
    if (r.horario) return '<details class="hor-line mt8"><summary class="xs row" style="gap:5px"><span class="' + (abierto(r) ? 'open-line' : 'muted') + ' row" style="gap:5px">' + ic('clock', 13) + estadoTxt(r) + '</span><span class="muted">· Ver horario</span>' + ic('down', 13) + '</summary>' + semanaHtml(r) + '</details>';
    return progOn() ? '<div class="xs muted mt8 row" style="gap:5px">' + ic('clock', 13) + 'Horario: ' + horarioTxt(r) + '</div>' : '';
  }
  // Horas para programar: cada 30 min, desde 30 min después de abrir hasta la hora de cerrar de ese día, y al menos 1 hora desde ahora.
  function slotsDe(r, dayOff) {
    var day = coDay(now()) + dayOff, base = day * 86400000 + CO_OFF, out = [], min = now() + 60 * 60000;
    var d = diaHoras(r, new Date(day * 86400000).getUTCDay());
    if (!d) return out;
    for (var m = Math.ceil((hm(d[0]) + 30) / 30) * 30; m <= hm(d[1]); m += 30) { var t = base + m * 60000; if (t >= min) out.push(t); }
    return out;
  }
  // Programar solo cuando la base de datos ya tiene el paso 009-programar.sql (si no, el pedido saldría como "lo antes posible").
  function progOn() { return !ONLINE || RESTAURANTS.some(function (r) { return r.progOk; }); }
  function wantsLater(r) { return progOn() && (!abierto(r) || !!S.co.later); }
  function progTag(o) { return o.scheduledFor && ['recibido', 'preparando', 'listo'].indexOf(o.status) >= 0 ? '<span class="badge prog">' + ic('clock', 12, { sw: 2.4 }) + capi(cuandoCo(o.scheduledFor)) + '</span>' : ''; }
  function bizWord(r) { return isShop(r) ? 'la tienda' : 'el restaurante'; }
  // Cover for a business: its photo, or (shops without a photo yet) a branded tile with the kind's icon.
  function cover(r, cls, style, w) {
    if (r && r.img) return photo(r.img, cls, style, w);
    var k = kindOf(r), big = /thumb/.test(cls || '') ? 20 : 44;
    return '<div class="ph kt kt-' + k.id + ' ' + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '><span class="kt-ico">' + ic(k.icon, big, { sw: 1.6 }) + '</span></div>';
  }

  // ---------- Seed data ----------
  var RESTAURANTS = [
    { id: 'llanero', name: 'Asadero El Llanero', short: 'El Llanero', img: IMG.asado, rating: 4.7, count: 86, eta: '25–35 min', pickup: '15 min', min: 15000, fee: 0,
      cats: ['Asados', 'Empanadas', 'Arepas', 'Jugos'], sub: 'Carne a la llanera · Pollo asado', address: 'Calle 10 # 8-24, El Centro', phone: '3100000001', nequi: '310 000 0001',
      dishes: [
        { id: 'carne', name: 'Carne a la llanera', desc: '300 g a la brasa, yuca, papa y ají', price: 28000, img: IMG.carne, top: true },
        { id: 'pollo', name: 'Medio pollo asado', desc: 'Con arepa, papa salada y guacamole', price: 22000, img: IMG.pollo },
        { id: 'emp', name: 'Empanadas llaneras x3', desc: 'De carne, con ají de la casa', price: 9000, img: IMG.emp },
        { id: 'arepa', name: 'Arepa con queso', desc: 'Asada en budare, queso costeño', price: 6000, img: IMG.arepa },
        { id: 'jugo', name: 'Jugo de maracuyá', desc: 'En agua o en leche, 16 oz', price: 5000, img: IMG.jugo }
      ] },
    { id: 'plaza', name: 'Pizzería La Plaza', short: 'La Plaza', img: IMG.pizza2, rating: 4.6, count: 112, eta: '30–40 min', pickup: '20 min', min: 20000, fee: 3000,
      cats: ['Pizza', 'Hamburguesas', 'Jugos'], sub: 'Pizza · Lasaña · Hamburguesas', address: 'Carrera 9 # 11-05, Parque principal', phone: '3100000002', nequi: '310 000 0002',
      dishes: [
        { id: 'pcarnes', name: 'Pizza de carnes mediana', desc: '8 porciones: jamón, salami, pollo y tocineta', price: 32000, img: IMG.pizza, top: true },
        { id: 'phawa', name: 'Pizza hawaiana personal', desc: 'Jamón, piña y mucho queso', price: 16000, img: IMG.pizza2 },
        { id: 'burger', name: 'Hamburguesa de la casa', desc: 'Carne 150 g, queso, tocineta y papas', price: 18000, img: IMG.burger },
        { id: 'lasana', name: 'Lasaña de pollo', desc: 'Con pan de ajo', price: 19000, img: IMG.pizza },
        { id: 'jugo', name: 'Jugo de maracuyá', desc: 'En agua, 16 oz', price: 5000, img: IMG.jugo }
      ] },
    { id: 'rosa', name: 'Piqueteadero Doña Rosa', short: 'Doña Rosa', img: IMG.pincho, rating: 4.8, count: 54, eta: '20–30 min', pickup: '10 min', min: 12000, fee: 0,
      cats: ['Asados', 'Empanadas', 'Arepas'], sub: 'Picadas · Chorizo · Pinchos', address: 'Calle 8 # 6-40, Barrio Libertadores', phone: '3100000003', nequi: '310 000 0003',
      // Demo del horario por día: abre por la tarde; los lunes no abre.
      horario: [['12:00', '22:00'], null, ['16:00', '23:00'], ['16:00', '23:00'], ['16:00', '23:00'], ['16:00', '23:30'], ['12:00', '23:30']],
      dishes: [
        { id: 'picada', name: 'Picada para dos', desc: 'Carne, chorizo, morcilla, papa criolla y arepa', price: 38000, img: IMG.pincho, top: true },
        { id: 'pincho', name: 'Pincho de res', desc: 'Con papa salada y ají', price: 9000, img: IMG.carne },
        { id: 'chorizo', name: 'Chorizo con arepa', desc: 'Chorizo santarrosano y arepa asada', price: 8000, img: IMG.arepa },
        { id: 'emp', name: 'Empanadas x3', desc: 'De pipián o de carne', price: 7500, img: IMG.emp },
        { id: 'jugo', name: 'Jugo de maracuyá', desc: 'En agua o en leche', price: 5000, img: IMG.jugo }
      ] },
    { id: 'salud', kind: 'drogueria', name: 'Droguería La Salud', short: 'La Salud', img: '', rating: 4.9, count: 23, eta: '20–30 min', pickup: '10 min', min: 0, fee: 2000,
      cats: [], sub: 'Medicamentos · Aseo personal · Bebés', address: 'Calle 9 # 7-15, El Centro', phone: '3100000004', nequi: '310 000 0004', dishes: [] }
  ];
  var CATS = [['Empanadas', IMG.emp], ['Asados', IMG.carne], ['Pollo', IMG.pollo], ['Arepas', IMG.arepa], ['Almuerzos', IMG.almuerzo], ['Hamburguesas', IMG.burger], ['Pizza', IMG.pizza], ['Jugos', IMG.jugo], ['Pescado', IMG.pescado], ['Comida rápida', IMG.pincho], ['Otros', '']];
  // Categorías propias que escribió algún negocio visible (además de las fijas). 'Otros' siempre al final.
  function catList() {
    var fixed = CATS.map(function (c) { return c[0]; }), extra = [];
    shown().forEach(function (r) { (r.cats || []).forEach(function (c) { if (fixed.indexOf(c) < 0 && extra.indexOf(c) < 0) extra.push(c); }); });
    return CATS.slice(0, -1).concat(extra.slice(0, 8).map(function (c) { return [c, '']; }), [CATS[CATS.length - 1]]);
  }
  var NO_REST = { id: '', name: 'Restaurante', short: 'Restaurante', img: '', rating: 0, count: 0, eta: '30–40 min', pickup: '15 min', min: 0, fee: 0, cats: [], sub: '', address: '', phone: '', nequi: '', dishes: [] };
  function R(id) { for (var i = 0; i < RESTAURANTS.length; i++) if (RESTAURANTS[i].id === id) return RESTAURANTS[i]; return ONLINE ? NO_REST : RESTAURANTS[0]; }
  // restaurants customers can order from (online: only those with a menu)
  function shown() { return RESTAURANTS.filter(function (r) { return !ONLINE || (r.aprobado !== false && (isShop(r) ? hasLoc(r) : r.dishes.length)); }); }
  // ---------- Not on Pido y Ido yet ----------
  // Real Villanueva businesses that have NOT joined. Shown greyed out under "Pronto en Pido y Ido" so customers can
  // ask them to join. Name + type only (no phone, address or photos: they did not sign up). Not orderable.
  // Source: bedrijven-villanueva.xlsx (20 nov 2026), without rows whose town still had to be checked.
  // A business disappears from this list by itself once it signs up with (about) the same name.
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'y').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var PRONTO = [
    ['restaurante', 'Asadero El Gran Ranchón', 'Carne a la llanera', ['Asados']],
    ['restaurante', 'Asadero Rico Pollo', 'Pollo asado', ['Pollo']],
    ['restaurante', 'Surtidora de Aves La Séptima', 'Pollo asado', ['Pollo']],
    ['restaurante', 'Asadero Don Pollo', 'Pollo asado', ['Pollo']],
    ['restaurante', 'Brasa Rojal', 'Asadero', ['Asados', 'Pollo']],
    ['restaurante', 'Pizzería VIP', 'Pizza · Comidas rápidas', ['Pizza']],
    ['restaurante', 'Kyrios Pizza 2', 'Pizza', ['Pizza']],
    ['restaurante', 'Italiamia Pizza', 'Pizza', ['Pizza']],
    ['restaurante', 'Hamburguesa Llanera', 'Hamburguesas', ['Hamburguesas']],
    ['restaurante', 'Restaurante Chino Shanghai', 'Comida china', []],
    ['restaurante', 'Pinchos Gourmet', 'Pinchos · Comidas rápidas', ['Asados']],
    ['restaurante', 'Estrato 6', 'Pizza · Cócteles', ['Pizza']],
    ['restaurante', 'Bragon', 'Restaurante', []],
    ['restaurante', 'El Rancho de Juanse', 'Restaurante', []],
    ['restaurante', 'Lechonería La Séptima', 'Lechona', []],
    ['restaurante', 'Asadero La Llanera', 'Carne a la llanera', ['Asados']],
    ['restaurante', 'Panadería Dallapan', 'Panadería · Tortas', []],
    ['restaurante', 'Los Potrillos', 'Restaurante', []],
    ['restaurante', 'Hotel Marlus Plaza', 'Restaurante del hotel', ['Almuerzos']],
    ['restaurante', 'Hotel Versalles', 'Restaurante del hotel', ['Almuerzos']],
    ['restaurante', 'Club Nicky Beach', 'Club · Restaurante', []],
    ['restaurante', 'El Petaco Bar', 'Bar', []],
    ['restaurante', 'Celestina Bar', 'Bar', []],
    ['drogueria', 'Droguería J&C Farmacias', 'Droguería'],
    ['drogueria', 'Droguería Llanofarma H&A', 'Droguería'],
    ['drogueria', 'Droguería Llano Farma', 'Droguería'],
    ['drogueria', 'Droguería Alemana', 'Droguería'],
    ['drogueria', 'Droguería Farmallanos', 'Droguería'],
    ['drogueria', 'Droguería Medic-Farma', 'Droguería'],
    ['drogueria', 'Droguería FarmaUno', 'Droguería'],
    ['drogueria', 'Droguería Villanueva', 'Droguería'],
    ['floristeria', 'Floristería Florecita Rokera', 'Flores · Arreglos'],
    ['minimercado', 'Surti Mayorista', 'Mercado · Por mayor'],
    ['minimercado', 'Universal Supermercado', 'Supermercado'],
    ['otro', 'Pañalera Universal', 'Pañales · Bebés'],
    ['licorera', 'Licorera La Cava', 'Licores'],
    ['licorera', 'Licorera Mr. Cachirri', 'Licores · Bar']
  ].map(function (x) { return { id: slug(x[1]) + (x[4] && x[4] !== 'Villanueva' ? '-' + slug(x[4]) : ''), kind: x[0], name: x[1], sub: x[2], cats: x[3] || [], town: x[4] || 'Villanueva' }; });
  // Next ten towns (bedrijven-volgende-10-dorpen.xlsx, 20 nov 2026; town confirmed, without the La Rebaja chain)
  var TOWNS2 = ["Acacías", "Aguazul", "Arauca", "Chiquinquirá", "Granada", "Paz de Ariporo", "Puerto López", "Saravena", "Tame", "Tauramena"];
  var PRONTO2 = [
    [0, "restaurante", "Asadero y Restaurante Brasa y Sabor", "Asadero", ["Asados"], "asadero-y-restaurante-brasa-y-sabor-acacias"],
    [0, "restaurante", "Bandido Burger & Grill", "Hamburguesas", ["Hamburguesas"], "bandido-burger-grill-acacias"],
    [0, "drogueria", "Delfos Acacías", "Droguería", [], "delfos-acacias"],
    [0, "drogueria", "Droguería Acacías", "Droguería", [], "drogueria-acacias"],
    [0, "drogueria", "Droguería Camohe Moringa", "Droguería", [], "drogueria-camohe-moringa-acacias"],
    [0, "drogueria", "Droguería Farmanix", "Droguería", [], "drogueria-farmanix-acacias"],
    [0, "drogueria", "Droguería Granfarma", "Droguería", [], "drogueria-granfarma-acacias"],
    [0, "drogueria", "Droguería Haskafarma", "Droguería", [], "drogueria-haskafarma-acacias"],
    [0, "drogueria", "Droguería Llano Verde", "Droguería", [], "drogueria-llano-verde-acacias"],
    [0, "drogueria", "Droguería Magna", "Droguería", [], "drogueria-magna-acacias"],
    [0, "drogueria", "Droguería Sanidad", "Droguería", [], "drogueria-sanidad-acacias"],
    [0, "drogueria", "Droguerías MacroSalud", "Droguería", [], "droguerias-macrosalud-acacias"],
    [0, "restaurante", "El Trío Parrilla del Mono", "Asadero · Parrilla", ["Asados"], "el-trio-parrilla-del-mono-acacias"],
    [0, "drogueria", "Farmacenter Disfarma FB", "Droguería", [], "farmacenter-disfarma-fb-acacias"],
    [0, "minimercado", "Farmacia y Minimarket Los Parrado", "Minimercado", [], "farmacia-y-minimarket-los-parrado-acacias"],
    [0, "drogueria", "Farmared VS", "Droguería", [], "farmared-vs-acacias"],
    [0, "restaurante", "Frambuesa", "Comidas rápidas", [], "frambuesa-acacias"],
    [0, "restaurante", "MIX Comidas Rápidas", "Comidas rápidas", [], "mix-comidas-rapidas-acacias"],
    [0, "restaurante", "Pizza House ENA", "Pizza", ["Pizza"], "pizza-house-ena-acacias"],
    [0, "restaurante", "Restaurante Limón Mandarino", "Comidas rápidas", [], "restaurante-limon-mandarino-acacias"],
    [0, "restaurante", "The Sándwich Shop", "Comidas rápidas", [], "the-sandwich-shop-acacias"],
    [0, "restaurante", "Almalibre", "Restaurante", ["Almuerzos"], "almalibre-acacias"],
    [0, "restaurante", "Azteca Parrilla", "Comidas rápidas", [], "azteca-parrilla-acacias"],
    [0, "restaurante", "Beirut", "Restaurante", ["Almuerzos"], "beirut-acacias"],
    [0, "restaurante", "Casa China", "China", [], "casa-china-acacias"],
    [0, "restaurante", "Celeste Restaurante", "Restaurante", ["Almuerzos"], "celeste-restaurante-acacias"],
    [0, "drogueria", "Drogas Farmacentro La 13", "Droguería", [], "drogas-farmacentro-la-13-acacias"],
    [0, "drogueria", "Drogas La 23", "Droguería", [], "drogas-la-23-acacias"],
    [0, "drogueria", "Drogas La Economía", "Droguería", [], "drogas-la-economia-acacias"],
    [0, "drogueria", "Droguería El Rodeo", "Droguería", [], "drogueria-el-rodeo-acacias"],
    [0, "drogueria", "Droguería Megafarma", "Droguería", [], "drogueria-megafarma-acacias"],
    [0, "drogueria", "Droguería Mundi Farma", "Droguería", [], "drogueria-mundi-farma-acacias"],
    [0, "drogueria", "Droguería Mylenphar", "Droguería", [], "drogueria-mylenphar-acacias"],
    [0, "drogueria", "Droguería Nico y Jhony", "Droguería", [], "drogueria-nico-y-jhony-acacias"],
    [0, "drogueria", "Droguería Pharmax Bachué", "Droguería", [], "drogueria-pharmax-bachue-acacias"],
    [0, "drogueria", "Droguería Santa Mónica", "Droguería", [], "drogueria-santa-monica-acacias"],
    [0, "restaurante", "El Orejano", "Asadero · Parrilla", ["Asados"], "el-orejano-acacias"],
    [0, "drogueria", "Farmacenter Katherine", "Droguería", [], "farmacenter-katherine-acacias"],
    [0, "drogueria", "Farmacenter Videlmédica", "Droguería", [], "farmacenter-videlmedica-acacias"],
    [0, "restaurante", "Gourmet Chepe Restaurante", "Restaurante", ["Almuerzos"], "gourmet-chepe-restaurante-acacias"],
    [0, "drogueria", "Hiperdroguerías Mi Tierra", "Droguería", [], "hiperdroguerias-mi-tierra-acacias"],
    [0, "restaurante", "Los Platos", "Restaurante", ["Almuerzos"], "los-platos-acacias"],
    [0, "restaurante", "Marvel Burger", "Hamburguesas", ["Hamburguesas"], "marvel-burger-acacias"],
    [0, "restaurante", "Mr Wu Express", "China", [], "mr-wu-express-acacias"],
    [0, "restaurante", "New York Acacías", "Pizza", ["Pizza"], "new-york-acacias"],
    [0, "restaurante", "Perú Sazón Acacías", "Restaurante", ["Almuerzos"], "peru-sazon-acacias"],
    [0, "restaurante", "Restaurante Corral de Piedra", "Restaurante", ["Almuerzos"], "restaurante-corral-de-piedra-acacias"],
    [0, "restaurante", "Restaurante Familiar Amparo", "Comida típica", ["Almuerzos"], "restaurante-familiar-amparo-acacias"],
    [0, "restaurante", "Restaurante Tres Palos", "Pizza", ["Pizza"], "restaurante-tres-palos-acacias"],
    [0, "drogueria", "Sikuani Acacías Farmacia", "Droguería", [], "sikuani-acacias-farmacia-acacias"],
    [0, "restaurante", "Vamos a Palenque", "Pescado · Mariscos", [], "vamos-a-palenque-acacias"],
    [0, "restaurante", "Wok Palace", "China", [], "wok-palace-acacias"],
    [0, "restaurante", "Estadero La Cimarronera", "Comida típica", ["Almuerzos"], "estadero-la-cimarronera-acacias"],
    [1, "drogueria", "Droguería Alemana Aguazul", "Droguería", [], "drogueria-alemana-aguazul"],
    [1, "drogueria", "Droguería Central Park", "Droguería", [], "drogueria-central-park-aguazul"],
    [1, "drogueria", "Droguería Colfam (Farmacenter Colfam)", "Droguería", [], "drogueria-colfam-farmacenter-colfam-aguazul"],
    [1, "drogueria", "Farma3A Droguerías", "Droguería", [], "farma3a-droguerias-aguazul"],
    [1, "drogueria", "Farmacenter Cusiana", "Droguería", [], "farmacenter-cusiana-aguazul"],
    [1, "drogueria", "Farmacenter Cusiana San Luis", "Droguería", [], "farmacenter-cusiana-san-luis-aguazul"],
    [1, "drogueria", "Farmacenter La Octava", "Droguería", [], "farmacenter-la-octava-aguazul"],
    [1, "drogueria", "Farmacenter Tua", "Droguería", [], "farmacenter-tua-aguazul"],
    [1, "drogueria", "Farmasalud del Llano", "Droguería", [], "farmasalud-del-llano-aguazul"],
    [1, "drogueria", "Blue-Farma Droguería", "Droguería", [], "blue-farma-drogueria-aguazul"],
    [1, "restaurante", "Café Canella", "Café", [], "cafe-canella-aguazul"],
    [1, "drogueria", "Copidrogas Oriental", "Droguería", [], "copidrogas-oriental-aguazul"],
    [1, "restaurante", "Don Plutarco", "Comida típica", ["Almuerzos"], "don-plutarco-aguazul"],
    [1, "drogueria", "Droguería Familiar Aguazul", "Droguería", [], "drogueria-familiar-aguazul"],
    [1, "drogueria", "Droguería Farma Solución", "Droguería", [], "drogueria-farma-solucion-aguazul"],
    [1, "drogueria", "Droguería Farmaroca", "Droguería", [], "drogueria-farmaroca-aguazul"],
    [1, "drogueria", "Droguería Llano Drogas", "Droguería", [], "drogueria-llano-drogas-aguazul"],
    [1, "drogueria", "Droguería Medi Vital", "Droguería", [], "drogueria-medi-vital-aguazul"],
    [1, "drogueria", "Droguería Multivida", "Droguería", [], "drogueria-multivida-aguazul"],
    [1, "drogueria", "Droguería Nutrifarma", "Droguería", [], "drogueria-nutrifarma-aguazul"],
    [1, "drogueria", "Droguería Nutrisalud", "Droguería", [], "drogueria-nutrisalud-aguazul"],
    [1, "drogueria", "Droguería Su Salud 2", "Droguería", [], "drogueria-su-salud-2-aguazul"],
    [1, "drogueria", "Droguería Super Salud", "Droguería", [], "drogueria-super-salud-aguazul"],
    [1, "drogueria", "Droguería Vida", "Droguería", [], "drogueria-vida-aguazul"],
    [1, "drogueria", "Droguería WR", "Droguería", [], "drogueria-wr-aguazul"],
    [1, "drogueria", "Farmared Plus Droguería #5", "Droguería", [], "farmared-plus-drogueria-5-aguazul"],
    [1, "restaurante", "Hamburguesas del Llano", "Hamburguesas", ["Hamburguesas"], "hamburguesas-del-llano-aguazul"],
    [1, "restaurante", "Stars Pizza", "Pizza", ["Pizza"], "stars-pizza-aguazul"],
    [1, "restaurante", "La Barra Restaurant", "Restaurante · Bar", [], "la-barra-restaurant-aguazul"],
    [2, "drogueria", "Droguería Alemana (Cl. 15 #15)", "Droguería", [], "drogueria-alemana-cl-15-15-arauca"],
    [2, "drogueria", "Droguería Alemana (Córdoba)", "Droguería", [], "drogueria-alemana-cordoba-arauca"],
    [2, "drogueria", "Droguería Farmanueva", "Droguería", [], "drogueria-farmanueva-arauca"],
    [2, "drogueria", "Droguería Único", "Droguería", [], "drogueria-unico-arauca"],
    [2, "drogueria", "Farmacenter Metrodrogas 20-27", "Droguería", [], "farmacenter-metrodrogas-20-27-arauca"],
    [2, "drogueria", "Farmacia JyS", "Droguería", [], "farmacia-jys-arauca"],
    [2, "drogueria", "Farmacia La 23", "Droguería", [], "farmacia-la-23-arauca"],
    [2, "drogueria", "Farmacia Policlínica", "Droguería", [], "farmacia-policlinica-arauca"],
    [2, "restaurante", "Restaurante Muralla China", "China", [], "restaurante-muralla-china-arauca"],
    [2, "restaurante", "Al Toke de Zümo", "Jugos · Comidas rápidas", ["Jugos"], "al-toke-de-zumo-arauca"],
    [2, "restaurante", "Boxes Burger House", "Hamburguesas", ["Hamburguesas"], "boxes-burger-house-arauca"],
    [2, "restaurante", "Burger Land", "Hamburguesas", ["Hamburguesas"], "burger-land-arauca"],
    [2, "restaurante", "By Love RG", "Restaurante", ["Almuerzos"], "by-love-rg-arauca"],
    [2, "restaurante", "C y P Carbón y Parrilla", "Asadero · Parrilla", ["Asados"], "c-y-p-carbon-y-parrilla-arauca"],
    [2, "restaurante", "Cacao", "Restaurante", ["Almuerzos"], "cacao-arauca"],
    [2, "restaurante", "Canea", "Restaurante", ["Almuerzos"], "canea-arauca"],
    [2, "restaurante", "Delicias Naturales", "Jugos · Saludable", ["Jugos"], "delicias-naturales-arauca"],
    [2, "drogueria", "Drogas de la 20", "Droguería", [], "drogas-de-la-20-arauca"],
    [2, "drogueria", "Droguería Andrea", "Droguería", [], "drogueria-andrea-arauca"],
    [2, "drogueria", "Droguería Medy-Farma", "Droguería", [], "drogueria-medy-farma-arauca"],
    [2, "drogueria", "Droguería Mi Salud", "Droguería", [], "drogueria-mi-salud-arauca"],
    [2, "drogueria", "Droguería Moderna", "Droguería", [], "drogueria-moderna-arauca"],
    [2, "drogueria", "Droguería Paz", "Droguería", [], "drogueria-paz-arauca"],
    [2, "drogueria", "Droguería San Luis", "Droguería", [], "drogueria-san-luis-arauca"],
    [2, "drogueria", "Droguería Vida Arauca", "Droguería", [], "drogueria-vida-arauca"],
    [2, "restaurante", "El Café de Jeanett", "Café", [], "el-cafe-de-jeanett-arauca"],
    [2, "restaurante", "El Crucero del Arauca", "Restaurante", ["Almuerzos"], "el-crucero-del-arauca"],
    [2, "restaurante", "El Krrito", "Comidas rápidas", [], "el-krrito-arauca"],
    [2, "drogueria", "Farma Silenia", "Droguería", [], "farma-silenia-arauca"],
    [2, "drogueria", "Farmacia C&C", "Droguería", [], "farmacia-c-c-arauca"],
    [2, "drogueria", "Farmadescuentos Beltrán", "Droguería", [], "farmadescuentos-beltran-arauca"],
    [2, "drogueria", "Farmamía Arauca", "Droguería", [], "farmamia-arauca"],
    [2, "restaurante", "Fuente de Soda Avenida 5ª", "Comidas rápidas", [], "fuente-de-soda-avenida-5a-arauca"],
    [2, "minimercado", "La Huerta Mercado Saludable", "Minimercado", [], "la-huerta-mercado-saludable-arauca"],
    [2, "restaurante", "La Juguería", "Jugos · Saludable", ["Jugos"], "la-jugueria-arauca"],
    [2, "restaurante", "Mariscos y Algo Más Restaurante Bar", "Pescado · Mariscos", [], "mariscos-y-algo-mas-restaurante-bar-arauca"],
    [2, "drogueria", "Metro Drogas Plus", "Droguería", [], "metro-drogas-plus-arauca"],
    [2, "restaurante", "Ochoa Food Company", "Comidas rápidas", [], "ochoa-food-company-arauca"],
    [2, "restaurante", "Pesque y Coma", "Pescado · Mariscos", [], "pesque-y-coma-arauca"],
    [2, "restaurante", "Restaurante Pancita Llena", "Comida típica", ["Almuerzos"], "restaurante-pancita-llena-arauca"],
    [2, "restaurante", "Restaurante Sabor & Sazón", "Comida típica", ["Almuerzos"], "restaurante-sabor-sazon-arauca"],
    [2, "restaurante", "Ricapizza", "Pizza", ["Pizza"], "ricapizza-arauca"],
    [2, "drogueria", "Super Drogas Arauca", "Droguería", [], "super-drogas-arauca"],
    [2, "restaurante", "Terrazas Restaurante", "Restaurante", ["Almuerzos"], "terrazas-restaurante-arauca"],
    [2, "restaurante", "The Bamboo Gourmet", "Restaurante", ["Almuerzos"], "the-bamboo-gourmet-arauca"],
    [2, "restaurante", "Tocc & Coffee", "Café", [], "tocc-coffee-arauca"],
    [2, "drogueria", "Farma Éxito Arauca", "Droguería", [], "farma-exito-arauca"],
    [2, "ferreteria", "Ferretería El Surtidor", "Ferretería", [], "ferreteria-el-surtidor-arauca"],
    [2, "restaurante", "La Granja Food Bar", "Comidas rápidas", [], "la-granja-food-bar-arauca"],
    [2, "restaurante", "Pimienta Rosa Gourmet", "Café · Bar", [], "pimienta-rosa-gourmet-arauca"],
    [2, "restaurante", "Roma39 Café-Bar", "Café · Bar", [], "roma39-cafe-bar-arauca"],
    [3, "restaurante", "Adrianos Pizza", "Pizza", ["Pizza"], "adrianos-pizza-chiquinquira"],
    [3, "minimercado", "Almacén El Vencedor", "Minimercado", [], "almacen-el-vencedor-chiquinquira"],
    [3, "restaurante", "Anros Pizza", "Pizza", ["Pizza"], "anros-pizza-chiquinquira"],
    [3, "minimercado", "Autoservicio Colombia Occidente", "Minimercado", [], "autoservicio-colombia-occidente-chiquinquira"],
    [3, "minimercado", "Autoservicio Donde Hugo", "Minimercado", [], "autoservicio-donde-hugo-chiquinquira"],
    [3, "minimercado", "Autoservicio El Deskuento", "Minimercado", [], "autoservicio-el-deskuento-chiquinquira"],
    [3, "minimercado", "Autoservicio Los Ortidescuentos", "Minimercado", [], "autoservicio-los-ortidescuentos-chiquinquira"],
    [3, "minimercado", "Autoservicio Merca Olímpico", "Minimercado", [], "autoservicio-merca-olimpico-chiquinquira"],
    [3, "minimercado", "Autoservicio Mercaexpress", "Minimercado", [], "autoservicio-mercaexpress-chiquinquira"],
    [3, "minimercado", "Autoservicio Rudavi", "Minimercado", [], "autoservicio-rudavi-chiquinquira"],
    [3, "minimercado", "Autoservicio Todo Menos", "Minimercado", [], "autoservicio-todo-menos-chiquinquira"],
    [3, "minimercado", "Central de Abarrotes DS", "Minimercado", [], "central-de-abarrotes-ds-chiquinquira"],
    [3, "minimercado", "Comercializadora Merka Pasión", "Minimercado", [], "comercializadora-merka-pasion-chiquinquira"],
    [3, "restaurante", "Comidas Rápidas El Rancho", "Comidas rápidas", [], "comidas-rapidas-el-rancho-chiquinquira"],
    [3, "drogueria", "Drogas La Economía Chiquinquirá", "Droguería", [], "drogas-la-economia-chiquinquira"],
    [3, "drogueria", "Drogas Súper Baratas", "Droguería", [], "drogas-super-baratas-chiquinquira"],
    [3, "drogueria", "Droguería Dismed", "Droguería", [], "drogueria-dismed-chiquinquira"],
    [3, "drogueria", "Droguería Family Alejo", "Droguería", [], "drogueria-family-alejo-chiquinquira"],
    [3, "drogueria", "Droguería Francesa", "Droguería", [], "drogueria-francesa-chiquinquira"],
    [3, "drogueria", "Droguería La Magdalena J&J", "Droguería", [], "drogueria-la-magdalena-j-j-chiquinquira"],
    [3, "drogueria", "Droguería Nueva", "Droguería", [], "drogueria-nueva-chiquinquira"],
    [3, "drogueria", "Droguería Vida Samaritana", "Droguería", [], "drogueria-vida-samaritana-chiquinquira"],
    [3, "drogueria", "Droguerías Macc Drogas", "Droguería", [], "droguerias-macc-drogas-chiquinquira"],
    [3, "restaurante", "El Gran Pollo", "Pollo", ["Pollo"], "el-gran-pollo-chiquinquira"],
    [3, "minimercado", "El Mercadiario de Chiquinquirá", "Minimercado", [], "el-mercadiario-de-chiquinquira"],
    [3, "restaurante", "El Taller Hamburguesería", "Hamburguesas", ["Hamburguesas"], "el-taller-hamburgueseria-chiquinquira"],
    [3, "drogueria", "Famidrogas", "Droguería", [], "famidrogas-chiquinquira"],
    [3, "restaurante", "Frisbroaster", "Pollo", ["Pollo"], "frisbroaster-chiquinquira"],
    [3, "restaurante", "Good Comidas", "Hamburguesas", ["Hamburguesas"], "good-comidas-chiquinquira"],
    [3, "drogueria", "Hiperdroguería I (24 horas)", "Droguería", [], "hiperdrogueria-i-24-horas-chiquinquira"],
    [3, "restaurante", "JC Burgwich", "Hamburguesas", ["Hamburguesas"], "jc-burgwich-chiquinquira"],
    [3, "restaurante", "Juan Gourmet Pizza", "Pizza", ["Pizza"], "juan-gourmet-pizza-chiquinquira"],
    [3, "minimercado", "La Klave es Aquí", "Minimercado", [], "la-klave-es-aqui-chiquinquira"],
    [3, "drogueria", "Megafarma Ideal", "Droguería", [], "megafarma-ideal-chiquinquira"],
    [3, "restaurante", "Memos Pizza", "Pizza", ["Pizza"], "memos-pizza-chiquinquira"],
    [3, "minimercado", "Mercadoexpress", "Minimercado", [], "mercadoexpress-chiquinquira"],
    [3, "minimercado", "Mercafamy de la 10", "Minimercado", [], "mercafamy-de-la-10-chiquinquira"],
    [3, "restaurante", "Muérdela", "Comidas rápidas", [], "muerdela-chiquinquira"],
    [3, "restaurante", "Pizzería & Café Maranata", "Pizza", ["Pizza"], "pizzeria-cafe-maranata-chiquinquira"],
    [3, "restaurante", "Pizzería El Taller", "Pizza", ["Pizza"], "pizzeria-el-taller-chiquinquira"],
    [3, "restaurante", "Punto Broaster Express", "Pollo", ["Pollo"], "punto-broaster-express-chiquinquira"],
    [3, "drogueria", "Servidrogas Lucila", "Droguería", [], "servidrogas-lucila-chiquinquira"],
    [3, "minimercado", "Supermercado La Esmeralda", "Minimercado", [], "supermercado-la-esmeralda-chiquinquira"],
    [3, "minimercado", "Supermercado Suyo", "Minimercado", [], "supermercado-suyo-chiquinquira"],
    [3, "restaurante", "Veronas Pizza", "Pizza", ["Pizza"], "veronas-pizza-chiquinquira"],
    [3, "restaurante", "Yolipollo", "Pollo", ["Pollo"], "yolipollo-chiquinquira"],
    [3, "restaurante", "Yonaz Pizza", "Pizza", ["Pizza"], "yonaz-pizza-chiquinquira"],
    [3, "restaurante", "Desayunadero La Novena", "Comida típica", ["Almuerzos"], "desayunadero-la-novena-chiquinquira"],
    [3, "restaurante", "Doménica Lunch & Drink", "Restaurante", ["Almuerzos"], "domenica-lunch-drink-chiquinquira"],
    [3, "restaurante", "El Chanchito Dorado", "Restaurante", ["Almuerzos"], "el-chanchito-dorado-chiquinquira"],
    [3, "restaurante", "El Mundo del Arroz", "Comidas rápidas", [], "el-mundo-del-arroz-chiquinquira"],
    [3, "drogueria", "Farmacenter Hiperdrogas A y P", "Droguería", [], "farmacenter-hiperdrogas-a-y-p-chiquinquira"],
    [3, "restaurante", "Frutería La Cigarra", "Jugos · Saludable", ["Jugos"], "fruteria-la-cigarra-chiquinquira"],
    [3, "restaurante", "Hojaldre La Reina", "Panadería", [], "hojaldre-la-reina-chiquinquira"],
    [3, "restaurante", "Kokopiko", "Restaurante", ["Almuerzos"], "kokopiko-chiquinquira"],
    [3, "restaurante", "Lechonería El Cerdito Especial", "Comida típica", ["Almuerzos"], "lechoneria-el-cerdito-especial-chiquinquira"],
    [3, "restaurante", "Mundi Delicias", "Panadería", [], "mundi-delicias-chiquinquira"],
    [3, "restaurante", "Panadería Buñuelos Pan", "Panadería", [], "panaderia-bunuelos-pan-chiquinquira"],
    [3, "restaurante", "Panadería La Española", "Panadería", [], "panaderia-la-espanola-chiquinquira"],
    [3, "restaurante", "Panadería Memo Lukas", "Panadería", [], "panaderia-memo-lukas-chiquinquira"],
    [3, "restaurante", "Panadería Milano", "Panadería", [], "panaderia-milano-chiquinquira"],
    [3, "restaurante", "Panadería Pilodelicias", "Panadería", [], "panaderia-pilodelicias-chiquinquira"],
    [3, "restaurante", "Panadería y Bizcochería La Madrileña", "Panadería", [], "panaderia-y-bizcocheria-la-madrilena-chiquinquira"],
    [3, "restaurante", "Panadería y Cafetería Dulce Sabor", "Panadería", [], "panaderia-y-cafeteria-dulce-sabor-chiquinquira"],
    [3, "restaurante", "Panadería y Cafetería El San José", "Panadería", [], "panaderia-y-cafeteria-el-san-jose-chiquinquira"],
    [3, "restaurante", "Panadería y Cafetería La Abundancia", "Panadería", [], "panaderia-y-cafeteria-la-abundancia-chiquinquira"],
    [3, "restaurante", "Panadería y Pastelería La Mariana", "Panadería", [], "panaderia-y-pasteleria-la-mariana-chiquinquira"],
    [3, "restaurante", "Pepper Gourmet", "Restaurante", ["Almuerzos"], "pepper-gourmet-chiquinquira"],
    [3, "restaurante", "Piqueteadero Calipso", "Comida típica", ["Almuerzos"], "piqueteadero-calipso-chiquinquira"],
    [3, "restaurante", "Piqueteadero El Chicharrón", "Comida típica", ["Almuerzos"], "piqueteadero-el-chicharron-chiquinquira"],
    [3, "restaurante", "Restaurante A Pedir de Boca", "Restaurante", ["Almuerzos"], "restaurante-a-pedir-de-boca-chiquinquira"],
    [3, "restaurante", "Restaurante y Cafetería Jireth", "Restaurante", ["Almuerzos"], "restaurante-y-cafeteria-jireth-chiquinquira"],
    [3, "restaurante", "Sabor a Mar", "Pescado · Mariscos", [], "sabor-a-mar-chiquinquira"],
    [3, "restaurante", "Vikingos Panadería", "Panadería", [], "vikingos-panaderia-chiquinquira"],
    [3, "restaurante", "Villa Dorada", "Restaurante", ["Almuerzos"], "villa-dorada-chiquinquira"],
    [3, "floristeria", "Vivero La Reina", "Floristería", [], "vivero-la-reina-chiquinquira"],
    [3, "restaurante", "Bolívar Plaza Café Bar", "Café · Bar", [], "bolivar-plaza-cafe-bar-chiquinquira"],
    [3, "otro", "Carnes Finas Ebenecer", "Carnicería", [], "carnes-finas-ebenecer-chiquinquira"],
    [3, "otro", "Carnes Finas San Mateo", "Carnicería", [], "carnes-finas-san-mateo-chiquinquira"],
    [3, "otro", "Centro Naturista Fuente de Vida", "Tienda naturista", [], "centro-naturista-fuente-de-vida-chiquinquira"],
    [3, "otro", "Centro Naturista San Antonio", "Tienda naturista", [], "centro-naturista-san-antonio-chiquinquira"],
    [3, "otro", "Farmacia Natural El Ángel de tu Salud", "Tienda naturista", [], "farmacia-natural-el-angel-de-tu-salud-chiquinquira"],
    [3, "otro", "Frutas Charpey", "Fruver", [], "frutas-charpey-chiquinquira"],
    [3, "restaurante", "Jalisco Restaurante Bar", "Restaurante · Bar", [], "jalisco-restaurante-bar-chiquinquira"],
    [3, "otro", "La Placita Campesina La Avenida", "Fruver", [], "la-placita-campesina-la-avenida-chiquinquira"],
    [3, "otro", "La Placita Campesina La Pola", "Fruver", [], "la-placita-campesina-la-pola-chiquinquira"],
    [3, "otro", "Maxicarnes El Bosque", "Carnicería", [], "maxicarnes-el-bosque-chiquinquira"],
    [4, "restaurante", "Asadero Brasa Rojal Granada", "Asadero · Pollo", ["Asados", "Pollo"], "asadero-brasa-rojal-granada"],
    [4, "drogueria", "Droguería Dasalud JJ", "Droguería", [], "drogueria-dasalud-jj-granada"],
    [4, "drogueria", "Droguería Farmacomercio", "Droguería", [], "drogueria-farmacomercio-granada"],
    [4, "drogueria", "Droguería Marannata", "Droguería", [], "drogueria-marannata-granada"],
    [4, "drogueria", "Droguería RR DC", "Droguería", [], "drogueria-rr-dc-granada"],
    [4, "drogueria", "Droguería Servi Economía Villa Olímpica", "Droguería", [], "drogueria-servi-economia-villa-olimpica-granada"],
    [4, "drogueria", "Droguerías Proteger", "Droguería", [], "droguerias-proteger-granada"],
    [4, "drogueria", "Farmacenter Farmatreinta", "Droguería", [], "farmacenter-farmatreinta-granada"],
    [4, "drogueria", "Farmacia Cruz Roja", "Droguería", [], "farmacia-cruz-roja-granada"],
    [4, "restaurante", "Mr. Anthony Pizzería", "Pizza", ["Pizza"], "mr-anthony-pizzeria-granada"],
    [4, "drogueria", "Pharma Gama", "Droguería", [], "pharma-gama-granada"],
    [4, "restaurante", "Pizzería Sanremo Express", "Pizza", ["Pizza"], "pizzeria-sanremo-express-granada"],
    [4, "drogueria", "Su Droguería NG", "Droguería", [], "su-drogueria-ng-granada"],
    [4, "restaurante", "Wok Rice Pizza", "China", [], "wok-rice-pizza-granada"],
    [4, "restaurante", "Arroz Paisa de la Abuela", "Comida típica", ["Almuerzos"], "arroz-paisa-de-la-abuela-granada"],
    [4, "restaurante", "Asadero Las Catiras", "Asadero", ["Asados"], "asadero-las-catiras-granada"],
    [4, "restaurante", "Asadero y Restaurante El Colono", "Asadero", ["Asados"], "asadero-y-restaurante-el-colono-granada"],
    [4, "restaurante", "Comidas Chocolo", "Comidas rápidas", [], "comidas-chocolo-granada"],
    [4, "restaurante", "Delicias Internacionales Gato Gourmet", "Restaurante", ["Almuerzos"], "delicias-internacionales-gato-gourmet-granada"],
    [4, "drogueria", "Drogas Copifam 2 Granada", "Droguería", [], "drogas-copifam-2-granada"],
    [4, "drogueria", "Drogas Copifam Granada", "Droguería", [], "drogas-copifam-granada"],
    [4, "drogueria", "Droguería América No. 2", "Droguería", [], "drogueria-america-no-2-granada"],
    [4, "drogueria", "Droguería de la Octava", "Droguería", [], "drogueria-de-la-octava-granada"],
    [4, "drogueria", "Droguería El Terminal", "Droguería", [], "drogueria-el-terminal-granada"],
    [4, "drogueria", "Droguería Farma 15 Centro", "Droguería", [], "drogueria-farma-15-centro-granada"],
    [4, "drogueria", "Droguería Jaksay", "Droguería", [], "drogueria-jaksay-granada"],
    [4, "drogueria", "Droguería JD La 18", "Droguería", [], "drogueria-jd-la-18-granada"],
    [4, "drogueria", "Droguería Montoya", "Droguería", [], "drogueria-montoya-granada"],
    [4, "drogueria", "Droguería Oriental de Granada", "Droguería", [], "drogueria-oriental-de-granada"],
    [4, "drogueria", "Farmacenter Camila La Octava", "Droguería", [], "farmacenter-camila-la-octava-granada"],
    [4, "drogueria", "Farmacenter La Aurora", "Droguería", [], "farmacenter-la-aurora-granada"],
    [4, "restaurante", "Jhon Camarón", "Pescado · Mariscos", [], "jhon-camaron-granada"],
    [4, "restaurante", "La Arrocera Paisa", "Comida típica", ["Almuerzos"], "la-arrocera-paisa-granada"],
    [4, "restaurante", "La Ballenita Comida de Mar", "Pescado · Mariscos", [], "la-ballenita-comida-de-mar-granada"],
    [4, "licorera", "Licorera Estanko P.G.", "Licorera", [], "licorera-estanko-p-g-granada"],
    [4, "restaurante", "Mata de Guadua Restaurante Vivero", "Comida típica", ["Almuerzos"], "mata-de-guadua-restaurante-vivero-granada"],
    [4, "restaurante", "Mesa y Cocina Granada", "Pizza", ["Pizza"], "mesa-y-cocina-granada"],
    [4, "restaurante", "Mi Gente Parrilla Bar", "Asadero · Parrilla", ["Asados"], "mi-gente-parrilla-bar-granada"],
    [4, "restaurante", "Panadería y Pastelería Calimeña", "Panadería", [], "panaderia-y-pasteleria-calimena-granada"],
    [4, "restaurante", "Restaurante Chino Shanghai", "China", [], "restaurante-chino-shanghai-granada"],
    [4, "restaurante", "Restaurante El Buen Sabor", "Comida típica", ["Almuerzos"], "restaurante-el-buen-sabor-granada"],
    [4, "restaurante", "Restaurante HV", "Restaurante", ["Almuerzos"], "restaurante-hv-granada"],
    [4, "restaurante", "Isla Dorada Gastrobar", "Restaurante · Bar", [], "isla-dorada-gastrobar-granada"],
    [4, "restaurante", "La Cabaña Estadero & Restaurante", "Comida típica", ["Almuerzos"], "la-cabana-estadero-restaurante-granada"],
    [5, "drogueria", "Drogas Paz del Llano", "Droguería", [], "drogas-paz-del-llano-paz-de-ariporo"],
    [5, "drogueria", "Droguería del Norte (Farmacenter del Norte)", "Droguería", [], "drogueria-del-norte-farmacenter-del-norte-paz-de-ariporo"],
    [5, "drogueria", "Droguería Famisalud PZA", "Droguería", [], "drogueria-famisalud-pza-paz-de-ariporo"],
    [5, "drogueria", "Droguería Farma 24/7 PZA", "Droguería", [], "drogueria-farma-24-7-pza-paz-de-ariporo"],
    [5, "drogueria", "Droguería Farmajireh", "Droguería", [], "drogueria-farmajireh-paz-de-ariporo"],
    [5, "drogueria", "Droguería La Económica de la Paz", "Droguería", [], "drogueria-la-economica-de-la-paz-paz-de-ariporo"],
    [5, "drogueria", "Droguería Medifarma Paz", "Droguería", [], "drogueria-medifarma-paz-paz-de-ariporo"],
    [5, "drogueria", "Droguería Super Salud Plus La Paz", "Droguería", [], "drogueria-super-salud-plus-la-paz-paz-de-ariporo"],
    [5, "drogueria", "Droguería Surtidrogas La Real", "Droguería", [], "drogueria-surtidrogas-la-real-paz-de-ariporo"],
    [5, "drogueria", "Droguería Vital y Salud", "Droguería", [], "drogueria-vital-y-salud-paz-de-ariporo"],
    [5, "minimercado", "Droguería y Supermarket Don Luis", "Minimercado", [], "drogueria-y-supermarket-don-luis-paz-de-ariporo"],
    [5, "drogueria", "Drogas Junior", "Droguería", [], "drogas-junior-paz-de-ariporo"],
    [5, "drogueria", "Drogas Karolina de la Paz", "Droguería", [], "drogas-karolina-de-la-paz-paz-de-ariporo"],
    [5, "drogueria", "Drogas Unicentro", "Droguería", [], "drogas-unicentro-paz-de-ariporo"],
    [5, "drogueria", "Droguería Don Andrés de la Paz", "Droguería", [], "drogueria-don-andres-de-la-paz-paz-de-ariporo"],
    [5, "drogueria", "Droguería El Descuento", "Droguería", [], "drogueria-el-descuento-paz-de-ariporo"],
    [5, "drogueria", "Droguería El Ángel de tu Salud", "Droguería", [], "drogueria-el-angel-de-tu-salud-paz-de-ariporo"],
    [5, "drogueria", "Droguería Farmanare La Paz", "Droguería", [], "drogueria-farmanare-la-paz-paz-de-ariporo"],
    [5, "drogueria", "Droguería Kamilos", "Droguería", [], "drogueria-kamilos-paz-de-ariporo"],
    [5, "drogueria", "Droguería Multifamiliar", "Droguería", [], "drogueria-multifamiliar-paz-de-ariporo"],
    [5, "drogueria", "Droguería Pazana", "Droguería", [], "drogueria-pazana-paz-de-ariporo"],
    [5, "drogueria", "Droguería Salud y Esperanza", "Droguería", [], "drogueria-salud-y-esperanza-paz-de-ariporo"],
    [5, "drogueria", "Droguería San Alberto", "Droguería", [], "drogueria-san-alberto-paz-de-ariporo"],
    [5, "licorera", "Licorera El Bodegón de la Paz", "Licorera", [], "licorera-el-bodegon-de-la-paz-paz-de-ariporo"],
    [5, "drogueria", "Mifarma Droguería PZA", "Droguería", [], "mifarma-drogueria-pza-paz-de-ariporo"],
    [5, "restaurante", "Pizza y Comidas Rápidas (Cra. 10)", "Pizza", ["Pizza"], "pizza-y-comidas-rapidas-cra-10-paz-de-ariporo"],
    [5, "restaurante", "Restaurante Guarulo", "Comida típica", ["Almuerzos"], "restaurante-guarulo-paz-de-ariporo"],
    [5, "restaurante", "Restaurante L&L El Marinero", "Pescado · Mariscos", [], "restaurante-l-l-el-marinero-paz-de-ariporo"],
    [5, "otro", "Agrolandia Agrícola & Ganadera", "Agropecuaria", [], "agrolandia-agricola-ganadera-paz-de-ariporo"],
    [5, "otro", "Agroveterinaria El Criollo", "Agropecuaria", [], "agroveterinaria-el-criollo-paz-de-ariporo"],
    [5, "ferreteria", "Cerámicas San Roque", "Ferretería", [], "ceramicas-san-roque-paz-de-ariporo"],
    [5, "restaurante", "Coffee Bar San Felipe", "Café · Bar", [], "coffee-bar-san-felipe-paz-de-ariporo"],
    [5, "ferreteria", "Pintumezclas del Llano", "Ferretería", [], "pintumezclas-del-llano-paz-de-ariporo"],
    [5, "ferreteria", "PVC Surti Manare", "Ferretería", [], "pvc-surti-manare-paz-de-ariporo"],
    [6, "drogueria", "Droguería Farmaen1", "Droguería", [], "drogueria-farmaen1-puerto-lopez"],
    [6, "drogueria", "Super Drogas La Quinta", "Droguería", [], "super-drogas-la-quinta-puerto-lopez"],
    [6, "drogueria", "Ana Vital Droguería", "Droguería", [], "ana-vital-drogueria-puerto-lopez"],
    [6, "restaurante", "Asadero Pollito con Papas", "Pollo", ["Pollo"], "asadero-pollito-con-papas-puerto-lopez"],
    [6, "drogueria", "Droguería Castaño", "Droguería", [], "drogueria-castano-puerto-lopez"],
    [6, "drogueria", "Droguería Copidrogas", "Droguería", [], "drogueria-copidrogas-puerto-lopez"],
    [6, "drogueria", "Droguería Copifam", "Droguería", [], "drogueria-copifam-puerto-lopez"],
    [6, "drogueria", "Droguería Jhorman", "Droguería", [], "drogueria-jhorman-puerto-lopez"],
    [6, "drogueria", "Droguería Menegua", "Droguería", [], "drogueria-menegua-puerto-lopez"],
    [6, "drogueria", "Droguería Médica", "Droguería", [], "drogueria-medica-puerto-lopez"],
    [6, "drogueria", "Droguería Pharmawilliam", "Droguería", [], "drogueria-pharmawilliam-puerto-lopez"],
    [6, "restaurante", "El Portal Criollo", "Comida típica", ["Almuerzos"], "el-portal-criollo-puerto-lopez"],
    [6, "restaurante", "El Toro Puerto López", "Asadero · Parrilla", ["Asados"], "el-toro-puerto-lopez"],
    [6, "drogueria", "Farmacia Amiga Divad", "Droguería", [], "farmacia-amiga-divad-puerto-lopez"],
    [6, "floristeria", "Floristería Jessika", "Floristería", [], "floristeria-jessika-puerto-lopez"],
    [6, "floristeria", "Floristería Modelo", "Floristería", [], "floristeria-modelo-puerto-lopez"],
    [6, "drogueria", "Hugo Drogas", "Droguería", [], "hugo-drogas-puerto-lopez"],
    [6, "restaurante", "Janipa Restaurante", "Café · Restaurante", [], "janipa-restaurante-puerto-lopez"],
    [6, "restaurante", "Restaurante Donde Zenaida", "Comida típica", ["Almuerzos"], "restaurante-donde-zenaida-puerto-lopez"],
    [6, "restaurante", "Restaurante La 14 del Pto", "Restaurante", ["Almuerzos"], "restaurante-la-14-del-pto-puerto-lopez"],
    [6, "restaurante", "Restaurante Santandereano", "Comida típica", ["Almuerzos"], "restaurante-santandereano-puerto-lopez"],
    [6, "restaurante", "Restaurante Su Taita", "Comida típica", ["Almuerzos"], "restaurante-su-taita-puerto-lopez"],
    [6, "restaurante", "Texas Burger Puerto López", "Hamburguesas", ["Hamburguesas"], "texas-burger-puerto-lopez"],
    [6, "ferreteria", "Ferrepinturas del Puerto", "Ferretería", [], "ferrepinturas-del-puerto-puerto-lopez"],
    [6, "restaurante", "Rancho Club El Primo (hostal y restaurante)", "Comida típica", ["Almuerzos"], "rancho-club-el-primo-hostal-y-restaurante-puerto-lopez"],
    [7, "restaurante", "Comidas Rápidas Donde Chiras", "Comidas rápidas", [], "comidas-rapidas-donde-chiras-saravena"],
    [7, "restaurante", "Comidas Rápidas YESZ", "Comidas rápidas", [], "comidas-rapidas-yesz-saravena"],
    [7, "drogueria", "Droguería Chaparros", "Droguería", [], "drogueria-chaparros-saravena"],
    [7, "drogueria", "Droguería Farma Ideal del Piedemonte", "Droguería", [], "drogueria-farma-ideal-del-piedemonte-saravena"],
    [7, "drogueria", "Droguería Farmadíaz", "Droguería", [], "drogueria-farmadiaz-saravena"],
    [7, "drogueria", "Droguería Farmaoriente", "Droguería", [], "drogueria-farmaoriente-saravena"],
    [7, "drogueria", "Droguería Salud Total La 16", "Droguería", [], "drogueria-salud-total-la-16-saravena"],
    [7, "drogueria", "Droguería San Antonio", "Droguería", [], "drogueria-san-antonio-saravena"],
    [7, "drogueria", "Droguería Santa Eduviges", "Droguería", [], "drogueria-santa-eduviges-saravena"],
    [7, "drogueria", "Droguería Uniclínica", "Droguería", [], "drogueria-uniclinica-saravena"],
    [7, "drogueria", "Droguería y Perfumería Karen", "Droguería", [], "drogueria-y-perfumeria-karen-saravena"],
    [7, "drogueria", "Droguería Ética", "Droguería", [], "drogueria-etica-saravena"],
    [7, "drogueria", "DROXI Total Farma", "Droguería", [], "droxi-total-farma-saravena"],
    [7, "restaurante", "El Butaco", "Asadero · Parrilla", ["Asados"], "el-butaco-saravena"],
    [7, "drogueria", "Farma G&D Asociados", "Droguería", [], "farma-g-d-asociados-saravena"],
    [7, "drogueria", "Farmacenter Santander III", "Droguería", [], "farmacenter-santander-iii-saravena"],
    [7, "drogueria", "Farmandrés", "Droguería", [], "farmandres-saravena"],
    [7, "drogueria", "Servidrogas", "Droguería", [], "servidrogas-saravena"],
    [7, "drogueria", "Biofarmas", "Droguería", [], "biofarmas-saravena"],
    [7, "drogueria", "Drogas Al Kosto", "Droguería", [], "drogas-al-kosto-saravena"],
    [7, "drogueria", "Droguería del Pueblo", "Droguería", [], "drogueria-del-pueblo-saravena"],
    [7, "drogueria", "Droguería Farmacuba", "Droguería", [], "drogueria-farmacuba-saravena"],
    [7, "drogueria", "Droguería Los Paisasos", "Droguería", [], "drogueria-los-paisasos-saravena"],
    [7, "drogueria", "Droguería Mis Paisas", "Droguería", [], "drogueria-mis-paisas-saravena"],
    [7, "drogueria", "Droguería Monserrate", "Droguería", [], "drogueria-monserrate-saravena"],
    [7, "drogueria", "Droguería Santa Brígida", "Droguería", [], "drogueria-santa-brigida-saravena"],
    [7, "drogueria", "Droguería Santander", "Droguería", [], "drogueria-santander-saravena"],
    [7, "drogueria", "Farmacenter Santander II", "Droguería", [], "farmacenter-santander-ii-saravena"],
    [7, "drogueria", "Farmacia La 13", "Droguería", [], "farmacia-la-13-saravena"],
    [7, "restaurante", "K-repa Saravena", "Comidas rápidas", [], "k-repa-saravena"],
    [7, "restaurante", "La Fontana", "Restaurante", ["Almuerzos"], "la-fontana-saravena"],
    [7, "restaurante", "Pecos Bill", "Restaurante", ["Almuerzos"], "pecos-bill-saravena"],
    [7, "restaurante", "Restaurante Wanú Comidas Rápidas", "Comidas rápidas", [], "restaurante-wanu-comidas-rapidas-saravena"],
    [7, "restaurante", "Ñaños", "Restaurante", ["Almuerzos"], "nanos-saravena"],
    [7, "restaurante", "B&liss Coffee Pub", "Café · Bar", [], "b-liss-coffee-pub-saravena"],
    [7, "otro", "Distribuidora Marcoagro", "Agropecuaria", [], "distribuidora-marcoagro-saravena"],
    [7, "drogueria", "Farmacenter Alkosto", "Droguería", [], "farmacenter-alkosto-saravena"],
    [7, "ferreteria", "Ferretería Delgadillo", "Ferretería", [], "ferreteria-delgadillo-saravena"],
    [7, "ferreteria", "Ferretería La Campana", "Ferretería", [], "ferreteria-la-campana-saravena"],
    [8, "restaurante", "Asadero La Jaula", "Asadero", ["Asados"], "asadero-la-jaula-tame"],
    [8, "drogueria", "Droguería Flor Amarillo", "Droguería", [], "drogueria-flor-amarillo-tame"],
    [8, "drogueria", "Droguería Santa Ana", "Droguería", [], "drogueria-santa-ana-tame"],
    [8, "drogueria", "Farmacastill", "Droguería", [], "farmacastill-tame"],
    [8, "drogueria", "Farmavicena", "Droguería", [], "farmavicena-tame"],
    [8, "drogueria", "Servifarma S&J", "Droguería", [], "servifarma-s-j-tame"],
    [8, "restaurante", "Arroces y Pastas", "Comidas rápidas", [], "arroces-y-pastas-tame"],
    [8, "restaurante", "Artesian", "Restaurante", ["Almuerzos"], "artesian-tame"],
    [8, "restaurante", "Asadero Los Halcones", "Asadero", ["Asados"], "asadero-los-halcones-tame"],
    [8, "drogueria", "Droguería Cristal", "Droguería", [], "drogueria-cristal-tame"],
    [8, "drogueria", "Droguería El Paisa", "Droguería", [], "drogueria-el-paisa-tame"],
    [8, "restaurante", "El Flautista", "Comidas rápidas", [], "el-flautista-tame"],
    [8, "restaurante", "Empanaditas.com", "Comidas rápidas", [], "empanaditas-com-tame"],
    [8, "drogueria", "Farmacia Farmafull San Pablo", "Droguería", [], "farmacia-farmafull-san-pablo-tame"],
    [8, "restaurante", "Génovas Llanero Emprendedor", "Comida típica", ["Almuerzos"], "genovas-llanero-emprendedor-tame"],
    [8, "restaurante", "Hallaca Llanera", "Comida típica", ["Almuerzos"], "hallaca-llanera-tame"],
    [8, "restaurante", "Hamburguesas de mi Pueblo", "Hamburguesas", ["Hamburguesas"], "hamburguesas-de-mi-pueblo-tame"],
    [8, "restaurante", "La Cachama del Palmar", "Pescado · Comida típica", [], "la-cachama-del-palmar-tame"],
    [8, "restaurante", "La Parrilla de Elvis", "Hamburguesas", ["Hamburguesas"], "la-parrilla-de-elvis-tame"],
    [8, "restaurante", "Longanizas Donde Lady", "Comida típica", ["Almuerzos"], "longanizas-donde-lady-tame"],
    [8, "restaurante", "Madurados Carbón y Parrilla", "Asadero · Parrilla", ["Asados"], "madurados-carbon-y-parrilla-tame"],
    [8, "restaurante", "Matecandela Punto Criollo", "Comida típica", ["Almuerzos"], "matecandela-punto-criollo-tame"],
    [8, "restaurante", "Nandez", "Restaurante", ["Almuerzos"], "nandez-tame"],
    [8, "restaurante", "Nova Fábrica de Sabores", "Restaurante", ["Almuerzos"], "nova-fabrica-de-sabores-tame"],
    [8, "restaurante", "Nómada Mercado Gastronómico", "Restaurante", ["Almuerzos"], "nomada-mercado-gastronomico-tame"],
    [8, "restaurante", "Rapyk Broaster", "Pollo", ["Pollo"], "rapyk-broaster-tame"],
    [8, "restaurante", "Restaurante Como en Casa", "Comida típica", ["Almuerzos"], "restaurante-como-en-casa-tame"],
    [8, "restaurante", "Restaurante Doña Juana", "Comida típica", ["Almuerzos"], "restaurante-dona-juana-tame"],
    [8, "restaurante", "Restaurante Madera y Tierra", "Comida típica", ["Almuerzos"], "restaurante-madera-y-tierra-tame"],
    [8, "restaurante", "Sanabria Café-Bistró", "Café · Restaurante", [], "sanabria-cafe-bistro-tame"],
    [8, "restaurante", "TAM Cafeinados", "Café", [], "tam-cafeinados-tame"],
    [8, "restaurante", "Tati Comidas Rápidas", "Comidas rápidas", [], "tati-comidas-rapidas-tame"],
    [8, "minimercado", "Tienda Maná del Oriente", "Minimercado", [], "tienda-mana-del-oriente-tame"],
    [8, "restaurante", "Tolúa Cocina Local", "Restaurante", ["Almuerzos"], "tolua-cocina-local-tame"],
    [8, "restaurante", "Toretos Parrilla Bar", "Asadero · Parrilla", ["Asados"], "toretos-parrilla-bar-tame"],
    [8, "restaurante", "Tungos Chivon", "Comida típica", ["Almuerzos"], "tungos-chivon-tame"],
    [8, "restaurante", "Balneario y Restaurante La Chamiza", "Restaurante", ["Almuerzos"], "balneario-y-restaurante-la-chamiza-tame"],
    [8, "restaurante", "Casa de Banquetes Shaddai", "Comidas rápidas", [], "casa-de-banquetes-shaddai-tame"],
    [8, "restaurante", "Casabe Beer & Food", "Restaurante · Bar", [], "casabe-beer-food-tame"],
    [8, "ferreteria", "Ferreléctricos Tame", "Ferretería", [], "ferrelectricos-tame"],
    [8, "restaurante", "Holistic Season Restaurante Bar", "Restaurante · Bar", [], "holistic-season-restaurante-bar-tame"],
    [8, "restaurante", "Pietra Gastropub", "Bar · Mariscos", [], "pietra-gastropub-tame"],
    [8, "otro", "Punto & Coma", "Carnicería", [], "punto-coma-tame"],
    [8, "restaurante", "Sabor Local & Moe's Bar", "Restaurante · Bar", [], "sabor-local-moe-s-bar-tame"],
    [9, "drogueria", "Droguería Alemana Tauramena", "Droguería", [], "drogueria-alemana-tauramena"],
    [9, "drogueria", "Droguería La Salud Store", "Droguería", [], "drogueria-la-salud-store-tauramena"],
    [9, "drogueria", "Droguería Megadescuentos", "Droguería", [], "drogueria-megadescuentos-tauramena"],
    [9, "drogueria", "Droguería Mejorana", "Droguería", [], "drogueria-mejorana-tauramena"],
    [9, "drogueria", "Droguería Santillana", "Droguería", [], "drogueria-santillana-tauramena"],
    [9, "drogueria", "Droguería Servidescuento", "Droguería", [], "drogueria-servidescuento-tauramena"],
    [9, "drogueria", "Droguería Tauramena", "Droguería", [], "drogueria-tauramena"],
    [9, "restaurante", "Container Bikers", "Comidas rápidas", [], "container-bikers-tauramena"],
    [9, "drogueria", "Droguería Economidrogas", "Droguería", [], "drogueria-economidrogas-tauramena"],
    [9, "drogueria", "Droguería La Primavera", "Droguería", [], "drogueria-la-primavera-tauramena"],
    [9, "drogueria", "Droguería Mastranto", "Droguería", [], "drogueria-mastranto-tauramena"],
    [9, "drogueria", "Droguería Palmarito", "Droguería", [], "drogueria-palmarito-tauramena"],
    [9, "drogueria", "Droguería Parkway", "Droguería", [], "drogueria-parkway-tauramena"],
    [9, "drogueria", "Droguería San Juan", "Droguería", [], "drogueria-san-juan-tauramena"],
    [9, "drogueria", "Droguería Tierradentro", "Droguería", [], "drogueria-tierradentro-tauramena"],
    [9, "licorera", "Licorera La 19", "Licorera", [], "licorera-la-19-tauramena"],
    [9, "restaurante", "UTTAMU Restaurante Bar", "Restaurante · Bar", [], "uttamu-restaurante-bar-tauramena"]
  ];
  PRONTO = PRONTO.concat(PRONTO2.map(function (x) { return { id: x[5], kind: x[1], name: x[2], sub: x[3] || kindOf({ kind: x[1] }).t, cats: x[4], town: TOWNS2[x[0]] }; }));
  // Businesses customers suggested (online: approved ones from Supabase; demo: the ones you suggested on this phone)
  var EXTRA = [], SK = 'pyi-sug';
  function extraFrom(r) { return { id: r.slug, kind: r.kind, name: r.name, sub: kindOf(r).t, cats: [], town: r.town || 'Villanueva', extra: true }; }
  if (!ONLINE) try { EXTRA = (JSON.parse(localStorage.getItem(SK) || '[]') || []).map(extraFrom); } catch (e) { EXTRA = []; }
  function allPronto() { var have = {}; PRONTO.forEach(function (p) { have[p.id] = 1; }); return PRONTO.concat(EXTRA.filter(function (p) { return !have[p.id]; })); }
  function myTown() { if (ui.ptown == null) { try { ui.ptown = localStorage.getItem('pyi-town') || ''; } catch (e) { ui.ptown = ''; } } return ui.ptown || 'Villanueva'; }
  function townsOf(list) { var t = []; list.forEach(function (p) { if (t.indexOf(p.town) < 0) t.push(p.town); }); return t; }
  function normName(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\b(asadero|restaurante|y|el|la|los|las|de|del|drogueria|pizzeria|panaderia|floristeria|licorera|hotel|villanueva)\b/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // the ones not (yet) in the app as a real business
  function sameBiz(a, b) { var n = normName(a), h = normName(b); return !!n && !!h && (h === n || (n.length > 4 && h.indexOf(n) >= 0) || (h.length > 4 && n.indexOf(h) >= 0)); }
  // the real business in the app that matches a "pronto" entry (once it joined)
  function joinedAs(p) { for (var i = 0; i < RESTAURANTS.length; i++) if (townOf(RESTAURANTS[i]) === p.town && sameBiz(p.name, RESTAURANTS[i].name)) return RESTAURANTS[i]; return null; }
  function pronto() { return allPronto().filter(function (p) { return !joinedAs(p); }); }
  function prontoHere() { var t = myTown(); return pronto().filter(function (p) { return p.town === t; }); }
  // ---------- "X personas lo piden" ----------
  // One request per person per business. Online: counted in Supabase (pronto_votes, one per anonymous account).
  // Demo: a made-up starting number per business plus your own click, all on this phone.
  var VK = 'pyi-votes', myV = {};
  try { myV = JSON.parse(localStorage.getItem(VK) || '{}') || {}; } catch (e) { myV = {}; }
  var votes = { n: {}, at: 0, busy: false, ok: !ONLINE };
  function demoBase(p) { var h = 0; for (var i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) % 997; return 3 + h % 38; }
  function voteN(p) { return ONLINE ? (votes.n[p.id] || 0) : (p.extra ? 0 : demoBase(p)) + (myV[p.id] ? 1 : 0); }
  function loadVotes() {
    if (!ONLINE || votes.busy || now() - votes.at < 60000) return;
    votes.busy = true; votes.at = now();
    CLOUD.bizExtra().then(function (rows) { EXTRA = rows.map(extraFrom); safeRender(); }, function () {});
    CLOUD.bizCounts().then(function (rows) {
      votes.busy = false; votes.ok = true; votes.n = {};
      rows.forEach(function (r) { votes.n[r.slug] = r.n; if (r.mine) myV[r.slug] = 1; });
      safeRender();
    }, function () { votes.busy = false; });
  }
  function vote(id) {
    var p = prontoById(id); if (!p || myV[id]) return;
    myV[id] = 1; try { localStorage.setItem(VK, JSON.stringify(myV)); } catch (e) {}
    if (ONLINE) {
      votes.n[id] = (votes.n[id] || 0) + 1;
      CLOUD.voteBiz(id).then(function (n) { votes.ok = true; votes.n[id] = n; safeRender(); }, function () {});
    }
  }
  function personas(n) { return n === 1 ? '1 persona' : n + ' personas'; }
  function prontoById(id) { var a = allPronto(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function joinLink() { return BASE + 'live/#/rest/registro'; }
  function pageLink(p) { return BASE + 'live/#/negocio/' + p.id; }
  function inviteText(p) {
    var n = voteN(p) + (myV[p.id] ? 0 : 1);
    return '¡Hola! Me gustaría pedirles a domicilio por Pido y Ido, la app de domicilios de ' + p.town + '.' +
      (votes.ok && n > 1 ? ' Ya somos ' + n + ' personas que lo pedimos, miren: ' + pageLink(p) + ' .' : '') +
      ' ¿Se animan a inscribirse? Es gratis y les llegan pedidos de todo el pueblo: ' + joinLink();
  }
  function inviteHref(p) { return 'https://wa.me/?text=' + encodeURIComponent(inviteText(p)); }
  function prontoRow(p) {
    return '<div class="pr-row"><a class="pr-main" href="#/negocio/' + p.id + '">' + cover({ kind: p.kind }, 'thumb s44 pr-ph') +
      '<div class="grow"><div class="b ellipsis">' + esc(p.name) + '</div><div class="small muted ellipsis">' + esc(p.sub) + (p.town !== myTown() ? ' · ' + esc(p.town) : '') + (votes.ok && voteN(p) ? ' · <span class="pr-n">' + voteN(p) + ' lo piden</span>' : '') + '</div></div></a>' +
      '<a class="pr-inv" data-vote="' + p.id + '" target="_blank" rel="noopener" href="' + inviteHref(p) + '" aria-label="Invitar a ' + esc(p.name) + ' por WhatsApp">' + ic('send', 15, { sw: 2.2 }) + 'Invitar</a></div>';
  }
  function sugLink(q) { return '<a class="pr-suggest mt16" href="#/sugerir?n=' + encodeURIComponent(String(q || '').trim()) + '">' + ic('plus', 18, { sw: 2.4 }) + '<span><b>¿No encuentras un negocio?</b> Sugiérelo y lo agregamos a “Pronto en Pido y Ido”.</span></a>'; }
  // Customer suggests a business that is not in the list yet. Online it appears after approval (or 3 different people).
  function scrSugerir(query) {
    if (!ui.sug || (query && query.n && ui.sug.from !== query.n)) ui.sug = { name: (query && query.n) || '', kind: 'restaurante', town: myTown(), note: '', from: query && query.n };
    var f = ui.sug, err = ui.sugErr || '';
    if (ui.sugDone) return '<div class="screen">' + topbar('¡Gracias!', '/inicio') + '<div class="card center" style="padding:28px 18px"><div class="pr-owner-ic" style="margin:0 auto">' + ic('check', 26, { sw: 2.6 }) + '</div>' +
      '<div class="t-h2 mt12">Recibimos tu sugerencia</div><div class="muted mt8" style="line-height:1.45">Revisamos <b>' + esc(ui.sugDone) + '</b> y, si está bien, aparece en “Pronto en Pido y Ido” para que más vecinos lo pidan. Tu voto ya cuenta.</div>' +
      '<a class="btn btn-primary btn-block mt16" href="#/inicio">Volver al inicio</a><button class="btn btn-ghost btn-block mt8" data-a="sugAgain">Sugerir otro</button></div></div>';
    var towns = townsOf(allPronto()); if (towns.indexOf(f.town) < 0 && f.town) towns.push(f.town);
    return '<div class="screen has-cta">' + topbar('Sugerir un negocio', '/inicio', 'Restaurante o tienda que te gustaría ver aquí') +
      '<div class="card"><div class="field"><label class="label" for="sg1">Nombre del negocio</label><input class="input' + (err === 'name' ? ' err' : '') + '" id="sg1" data-m="ui.sug.name" value="' + esc(f.name) + '" maxlength="80" placeholder="Ej.: Asadero Los Compadres" autocomplete="off"></div>' +
      '<div class="label mt12">¿Qué es?</div><div class="kinds">' + KINDS.map(function (x) {
        return '<button class="kind' + (x.id === f.kind ? ' on' : '') + '" data-a="sugKind" data-v="' + x.id + '" aria-pressed="' + (x.id === f.kind) + '"><span class="ki kt-' + x.id + '">' + ic(x.icon, 20, { sw: 1.8 }) + '</span><span>' + x.t + '</span></button>';
      }).join('') + '</div>' +
      '<div class="field mt12"><label class="label" for="sg2">Pueblo</label><input class="input' + (err === 'town' ? ' err' : '') + '" id="sg2" data-m="ui.sug.town" value="' + esc(f.town) + '" maxlength="40" list="sgTowns" autocomplete="off"><datalist id="sgTowns">' + towns.map(function (t) { return '<option value="' + esc(t) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field"><label class="label" for="sg3">Algo más (opcional)</label><textarea class="input" id="sg3" data-m="ui.sug.note" rows="2" maxlength="300" placeholder="Dónde queda, qué venden…">' + esc(f.note) + '</textarea></div></div>' +
      '<div class="small muted mt12">No pongas teléfonos ni datos personales. Revisamos cada sugerencia antes de mostrarla.</div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="sugSend"' + (ui.sugBusy ? ' disabled' : '') + '>' + (ui.sugBusy ? 'Enviando…' : 'Enviar sugerencia') + '</button></div></div>';
  }
  // Own page for a business that has not joined yet: #/negocio/<slug>. Shareable. Not orderable.
  function scrNegocio(id) {
    var p = prontoById(id);
    if (!p) return '<div class="screen">' + topbar('Negocio', '/inicio') + '<div class="empty">No encontramos este negocio.</div></div>';
    var j = joinedAs(p);
    if (j && shown().indexOf(j) >= 0) { setTimeout(function () { location.replace('#/r/' + j.id); }, 0); return scrLoading(j.name); }
    loadVotes();
    var k = kindOf(p), shop = isShop(p), word = shop ? 'negocio' : 'restaurante', n = voteN(p), me = !!myV[p.id];
    var alt = shown().filter(function (r) { return isShop(r) ? r.kind === p.kind : !shop && (!p.cats.length || r.cats.some(function (c) { return p.cats.indexOf(c) >= 0; })); }).slice(0, 3);
    var share = 'https://wa.me/?text=' + encodeURIComponent('¿Te gusta ' + p.name + '? Todavía no está en Pido y Ido. Entra aquí y pídele que se una, así le podemos pedir a domicilio: ' + pageLink(p));
    var h = '<div class="screen flush"><div class="hero pr-hero">' + cover({ kind: p.kind }, '', 'height:200px;width:100%') +
      '<a class="icon-btn back" href="#/inicio" aria-label="Volver">' + ic('back', 22) + '</a>' +
      '<a class="icon-btn fav" data-vote="' + p.id + '" target="_blank" rel="noopener" href="' + share + '" aria-label="Compartir esta página">' + ic('share', 20) + '</a></div>' +
      '<div class="card raised info-card"><span class="pr-tag">' + ic('clock', 13, { sw: 2.4 }) + 'Aún no está en Pido y Ido</span>' +
      '<h1 class="t-title mt8" style="font-size:24px">' + esc(p.name) + '</h1><div class="small muted mt4">' + ic(k.icon, 14) + ' ' + esc(p.sub) + ' · ' + esc(p.town) + '</div>' +
      '<div class="note grey mt12">Por ahora no le puedes pedir aquí. Cuando se una, vas a ver su ' + (shop ? 'catálogo' : 'menú') + ' en esta misma página.</div></div>' +
      '<div class="pad">' +
      '<div class="card mt20 pr-demand">' + (votes.ok ? (n ? '<div class="pr-big">' + n + '</div><div class="b mt4" style="font-size:16px">' + (n === 1 ? 'persona ya pidió' : 'personas ya pidieron') + ' que ' + esc(p.name) + ' se una a Pido y Ido</div>' :
        '<div class="b" style="font-size:16px">Sé la primera persona en pedir que ' + esc(p.name) + ' se una</div>') : '<div class="b" style="font-size:16px">¿Quieres pedirle a domicilio a ' + esc(p.name) + '?</div>') +
        (me ? '<div class="pr-done mt12">' + ic('check', 18, { sw: 2.6 }) + (n > 1 ? 'Tú y ' + personas(n - 1) + ' más lo están pidiendo' : 'Ya lo pediste') + '</div>' :
          '<button class="btn btn-primary btn-block mt12" data-a="vote" data-v="' + p.id + '">' + ic('heart', 18, { sw: 2.4 }) + ' Yo también quiero pedir aquí</button>') +
        '<div class="xs muted mt8">Se cuenta una vez por celular. ' + (shop ? 'El negocio' : 'El restaurante') + ' ve este número cuando abre esta página.</div></div>' +
      '<div class="pr-ask mt16"><span class="pr-ask-ic">' + ic('heart', 20, { sw: 2.2 }) + '</span><span><b>¿Te gusta este ' + word + '?</b> Pídele que se una a Pido y Ido. Así le puedes pedir a domicilio desde tu celular, y pagas al recibir.</span></div>' +
      '<div class="t-h2 mt24">¿Cómo puedes ayudar?</div>' +
      '<div class="card mt12 pr-help">' +
        '<div class="pr-step"><span class="n">1</span><div class="grow"><div class="b">Invítalo por WhatsApp</div><div class="small muted">Le mandas un mensaje listo con el enlace para inscribirse gratis.</div></div></div>' +
        '<a class="btn btn-' + (me ? 'primary' : 'outline') + ' btn-block mt8" data-vote="' + p.id + '" target="_blank" rel="noopener" href="' + inviteHref(p) + '">' + ic('send', 18) + ' Invitar por WhatsApp</a>' +
        '<div class="pr-step mt16"><span class="n">2</span><div class="grow"><div class="b">Díselo cuando vayas</div><div class="small muted">“¿Ya están en Pido y Ido? Me gustaría pedirles a domicilio.”</div></div></div>' +
        '<div class="pr-step mt16"><span class="n">3</span><div class="grow"><div class="b">Comparte esta página</div><div class="small muted">Entre más vecinos lo pidan, más rápido se une.</div></div></div>' +
        '<a class="btn btn-outline btn-block mt8" data-vote="' + p.id + '" target="_blank" rel="noopener" href="' + share + '">' + ic('share', 18) + ' Compartir con vecinos</a>' +
      '</div>' +
      (alt.length ? '<div class="t-h2 mt24">Mientras tanto, pide en</div><div class="card mt12" style="padding:4px 14px">' + alt.map(function (r) {
        return '<a class="list-row" href="#/r/' + r.id + '">' + cover(r, 'thumb') + '<div class="grow"><div class="b">' + esc(r.name) + '</div><div class="small muted">' + esc(r.sub || kindOf(r).t) + ' · ' + r.eta + '</div></div>' + ic('right', 18) + '</a>';
      }).join('') + '</div>' : '') +
      '<div class="card mt24 pr-owner"><div class="row" style="gap:12px"><span class="pr-owner-ic">' + ic('store', 22) + '</span><div class="grow"><div class="b">¿Eres el dueño de ' + esc(p.name) + '?</div><div class="small muted mt4">' + (votes.ok && n ? '<b style="color:var(--text)">' + personas(n) + ' ya te quieren pedir por Pido y Ido.</b> ' : '') + 'Inscríbete gratis en 10 minutos y recibe pedidos de todo Villanueva por WhatsApp. Sin contrato.</div></div></div>' +
      '<button class="btn btn-soft btn-block mt12" data-a="claim" data-v="' + p.id + '">Inscribir mi ' + word + ' gratis</button></div>' +
      '<div class="xs muted center mt16" style="padding-bottom:24px">Este ' + word + ' no tiene relación con Pido y Ido. Mostramos solo su nombre para que los vecinos lo puedan invitar.</div>' +
      '</div></div>';
    return h;
  }
  // ---------- Towns ----------
  // A town is "Activo" as soon as it has one business customers can order from (menu, or shop on the map);
  // until then it shows "Pronto" businesses only (invite + suggest). Businesses without a town are in Villanueva.
  var LIVE_TOWN = 'Villanueva';
  function townOf(r) { return (r && r.town) || LIVE_TOWN; }
  function isLive(t) { return shown().some(function (r) { return townOf(r) === t; }); }
  function shownHere() { var t = myTown(); return shown().filter(function (r) { return townOf(r) === t; }); }
  var TOWN_GEO = { 'Villanueva': [4.6075, -72.9289], 'Acacías': [3.987, -73.758], 'Aguazul': [5.172, -72.547], 'Arauca': [7.084, -70.759], 'Chiquinquirá': [5.617, -73.818],
    'Granada': [3.546, -73.707], 'Paz de Ariporo': [5.88, -71.892], 'Puerto López': [4.084, -72.957], 'Saravena': [6.953, -71.873], 'Tame': [6.461, -71.73], 'Tauramena': [5.017, -72.748] };
  var TOWN_DEP = { 'Villanueva': 'Casanare', 'Acacías': 'Meta', 'Aguazul': 'Casanare', 'Arauca': 'Arauca', 'Chiquinquirá': 'Boyacá', 'Granada': 'Meta', 'Paz de Ariporo': 'Casanare', 'Puerto López': 'Meta', 'Saravena': 'Arauca', 'Tame': 'Arauca', 'Tauramena': 'Casanare' };
  function hasTown() { myTown(); return !!ui.ptown; }
  function setTown(t) { ui.ptown = t; ui.prontoAll = false; ui.cat = null; ui.kind = null; try { localStorage.setItem('pyi-town', t); } catch (e) {} }
  function allTowns() {
    var t = [];
    shown().forEach(function (r) { if (t.indexOf(townOf(r)) < 0) t.push(townOf(r)); });
    if (t.indexOf(LIVE_TOWN) < 0) t.push(LIVE_TOWN);
    townsOf(pronto()).forEach(function (x) { if (t.indexOf(x) < 0) t.push(x); });
    return t;
  }
  function townCount(t) { return pronto().filter(function (p) { return p.town === t; }).length; }
  function scrPueblo(first) {
    var cur = hasTown() ? myTown() : '';
    var rows = allTowns().map(function (t) {
      var live = isLive(t), n = townCount(t);
      return '<button class="town-row' + (t === cur ? ' on' : '') + '" data-a="pickTown" data-v="' + esc(t) + '"><span class="town-ic' + (live ? ' live' : '') + '">' + ic('pin', 20, { sw: 2.2 }) + '</span>' +
        '<span class="grow"><span class="b" style="display:block">' + esc(t) + '</span><span class="small muted">' + esc(TOWN_DEP[t] || '') + ' · ' + (live ? 'Ya puedes pedir a domicilio' : n + ' negocios por invitar') + '</span></span>' +
        (live ? '<span class="town-live">Activo</span>' : '<span class="town-soon">Pronto</span>') + '</button>';
    }).join('');
    return '<div class="screen">' + (first ? '<div class="row" style="gap:10px">' + logo(40, 'mark') + '<span class="b" style="font-size:17px">Pido y Ido</span></div>' : topbar('Elige tu pueblo', '/inicio')) +
      (first ? '<h1 class="t-title mt16" style="font-size:28px">¿Dónde estás?</h1><div class="muted mt4">Elige tu pueblo para ver los restaurantes y tiendas de allí.</div>' : '') +
      '<button class="btn btn-soft btn-block mt16" data-a="townGeo">' + ic('pin', 18) + ' Usar mi ubicación</button>' +
      '<div class="card mt16 town-list">' + rows + '</div>' +
      '<div class="small muted mt12 center">¿Tu pueblo no está? <a class="link" href="#/sugerir">Sugiere un negocio</a> y lo tenemos en cuenta.</div></div>';
  }
  // Home for a town where Pido y Ido does not take orders yet
  function scrInicioPronto() {
    var t = myTown(), pr = prontoHere(), prShops = pr.filter(isShop), tiendas = prShops.length && ui.home === 'tiendas';
    var h = '<div class="screen has-tabs"><div class="row">' + logo(40, 'mark') + '<button class="grow" style="text-align:left" data-a="goPueblo"><div class="xs muted">Tu pueblo</div><div class="b row" style="gap:4px;font-size:15px"><span class="ellipsis">' + esc(t) + '</span><span class="town-soon sm">Pronto</span>' + ic('down', 16) + '</div></button></div>' +
      '<div class="card mt16 town-soon-card"><div class="t-h2">Pido y Ido llega pronto a ' + esc(t) + '</div><div class="muted mt8" style="line-height:1.45">Todavía no puedes pedir aquí. Mira qué negocios de ' + esc(t) + ' queremos sumar, y pídeles que se unan: entre más vecinos lo pidan, más rápido llegamos.</div>' +
      '<a class="btn btn-outline btn-block mt12" href="#/rest/registro">¿Tienes un negocio en ' + esc(t) + '? Inscríbete gratis</a></div>' +
      (prShops.length && prShops.length < pr.length ? '<div class="seg home-seg mt16"><button class="' + (tiendas ? '' : 'on') + '" data-a="homeTab" data-v="comida">' + ic('utensils', 17) + 'Comida</button><button class="' + (tiendas ? 'on' : '') + '" data-a="homeTab" data-v="tiendas">' + ic('basket', 17) + 'Tiendas</button></div>' : '');
    var list = prShops.length && prShops.length < pr.length ? pr.filter(function (p) { return isShop(p) === !!tiendas; }) : pr;
    return h + prontoSection(list, tiendas) + '</div>' + tabs('cliente', 'inicio');
  }
  function prontoSection(list, tiendas) {
    loadVotes();
    var towns = townsOf(pronto()), sug = '<a class="pr-suggest mt12" href="#/sugerir">' + ic('plus', 18, { sw: 2.4 }) + '<span><b>¿Falta tu ' + (tiendas ? 'tienda' : 'lugar') + ' favorito?</b> Sugiérelo y lo agregamos a la lista.</span></a>';
    var chips = '' && towns.length > 1 ? '<div class="chips scroll mt12">' + towns.map(function (t) { return '<button class="chip sm' + (t === myTown() ? ' on' : '') + '" data-a="ptown" data-v="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' : '';
    if (!list.length) return '<div class="pronto mt24"><div class="t-h2">Pronto en Pido y Ido</div>' + chips + sug + '</div>';
    list = list.map(function (p, i) { return [p, i]; }).sort(function (a, b) { return voteN(b[0]) - voteN(a[0]) || a[1] - b[1]; }).map(function (x) { return x[0]; });
    var all = ui.prontoAll || list.length <= 6, vis = all ? list : list.slice(0, 5);
    return '<div class="pronto mt24"><div class="row between"><div class="t-h2">Pronto en Pido y Ido</div><span class="pr-tag">Aún no están</span></div>' + chips +
      '<div class="pr-ask mt12"><span class="pr-ask-ic">' + ic('heart', 18, { sw: 2.2 }) + '</span><span><b>¿Te gusta alguno de estos ' + (tiendas ? 'negocios' : 'lugares') + '?</b> Pídele que se una a Pido y Ido. Así también le podrás pedir a domicilio desde aquí.</span></div>' +
      '<div class="card mt12 pr-list">' + vis.map(prontoRow).join('') + '</div>' +
      (all ? '' : '<button class="btn btn-outline btn-block mt12" data-a="prontoAll">Ver los ' + list.length + '</button>') + sug + '</div>';
  }

  function seed() {
    var t = now();
    var mk = function (o) { o.subtotal = o.items.reduce(function (a, i) { return a + i.price * i.qty; }, 0); o.total = o.subtotal + (o.fee || 0); return o; };
    return {
      v: 2,
      user: { name: 'Luz Marina', phone: '3100000000', address: 'Barrio El Centro, dos casas después de la iglesia, puerta azul' },
      open: { llanero: true, plaza: true, rosa: true, salud: true },
      ratings: {},
      cart: { restId: null, items: {}, mode: 'dom' },
      co: { pay: 'ef', cash: 'exact', note: '', geo: null },
      nextId: 146,
      restId: 'llanero',
      riders: {
        jairo: { id: 'jairo', name: 'Don Jairo', phone: '3120000000', vehicle: 'Moto', barrio: 'El Centro', color: 'moto roja' },
        yesid: { id: 'yesid', name: 'Yesid Rojas', phone: '3130000000', vehicle: 'Moto', barrio: 'Los Libertadores' },
        andrea: { id: 'andrea', name: 'Andrea Martínez', phone: '3140000000', vehicle: 'Moto', barrio: 'El Centro', hours: ['Noche', 'Fines de semana'], docs: ['Licencia', 'SOAT'], board: true },
        camilo: { id: 'camilo', name: 'Camilo Pérez', phone: '3150000000', vehicle: 'Bicicleta', barrio: 'San Agustín', hours: ['Mediodía', 'Noche'], docs: [], board: true },
        wilmer: { id: 'wilmer', name: 'Wilmer Rincón', phone: '3160000000', vehicle: 'Moto', barrio: 'La Esperanza', hours: ['Mañana', 'Mediodía', 'Noche', 'Fines de semana'], docs: ['Licencia'], board: true },
        yurani: { id: 'yurani', name: 'Yurani Castro', phone: '3170000000', vehicle: 'Moto', barrio: 'Villa del Prado', hours: ['Noche', 'Fines de semana'], docs: ['Licencia', 'SOAT'], board: true }
      },
      myRiders: { llanero: ['jairo', 'yesid', 'andrea'], plaza: ['yesid'], rosa: [] },
      myProfile: null,
      promo: { restId: 'llanero', slug: 'marta', pct: 5 },
      ref: null,
      chats: {},
      orders: [
        mk({ id: '0145', restId: 'salud', mine: false, customer: { name: 'Marleny Ruiz', phone: '3120000001', address: 'Barrio San Agustín, casa esquinera verde' },
          items: [], wish: 'Acetaminofén 500 mg x 10\nSuero oral x 2\nCuritas', fee: 2000, mode: 'dom', note: '', pay: 'ef', cashGiven: 50000, pin: '3381', status: 'recibido', createdAt: t - 2 * 60000 }),
        mk({ id: '0144', restId: 'llanero', mine: false, customer: { name: 'Carlos Gómez', phone: '3110000000', address: 'Los Libertadores, frente a la tienda' },
          items: [{ id: 'pollo', name: 'Medio pollo asado', price: 22000, qty: 2 }, { id: 'emp', name: 'Empanadas llaneras x3', price: 9000, qty: 1 }],
          fee: 0, mode: 'dom', note: 'Una sin ají, por favor', pay: 'ef', cashGiven: 60000, pin: '5173', status: 'recibido', createdAt: t - 60000 }),
        mk({ id: '0143', restId: 'llanero', mine: false, customer: { name: 'Diana Morales', phone: '3180000000', address: 'Villa del Prado, casa 12' },
          items: [{ id: 'carne', name: 'Carne a la llanera', price: 28000, qty: 1 }], fee: 0, mode: 'dom', note: '', pay: 'nequi', cashGiven: 0, pin: '9032',
          status: 'en_camino', riderId: 'yesid', etaMin: 30, createdAt: t - 31 * 60000, acceptedAt: t - 30 * 60000, sentAt: t - 6 * 60000 }),
        mk({ id: '0142', restId: 'llanero', mine: false, customer: { name: 'Andrés Pérez', phone: '3190000000', address: 'El Centro, Calle 12 # 9-30' },
          items: [{ id: 'carne', name: 'Carne a la llanera', price: 28000, qty: 1 }, { id: 'jugo', name: 'Jugo de maracuyá', price: 5000, qty: 1 }], fee: 0, mode: 'dom', note: '', pay: 'ef', cashGiven: 50000, pin: '4827',
          status: 'preparando', etaMin: 30, createdAt: t - 13 * 60000, acceptedAt: t - 12 * 60000 }),
        mk({ id: '0141', restId: 'llanero', mine: true, customer: { name: 'Luz Marina', phone: '3100000000', address: 'Barrio El Centro, dos casas después de la iglesia, puerta azul' },
          items: [{ id: 'carne', name: 'Carne a la llanera', price: 28000, qty: 1 }, { id: 'jugo', name: 'Jugo de maracuyá', price: 5000, qty: 1 }], fee: 0, mode: 'dom', note: '', pay: 'ef', cashGiven: 50000, pin: '2210',
          status: 'entregado', riderId: 'jairo', createdAt: t - 26 * 3600000, deliveredAt: t - 25.5 * 3600000, rating: 5, tags: ['Llegó caliente'] })
      ]
    };
  }

  // ---------- State ----------
  var KEY = ONLINE ? 'pidoyido_live_v1' : 'pidoyido_demo_v2';
  var S;
  function seedLive() {
    return { v: 2, live: true, user: { name: '', phone: '', address: '' }, open: {}, ratings: {}, cart: { restId: null, items: {}, mode: 'dom' },
      co: { pay: 'ef', cash: 'exact', note: '', geo: null }, restId: null, riders: {}, myRiders: {}, myProfile: null,
      promo: { restId: null, slug: '', pct: 5 }, ref: null, chats: {}, orders: [], restCache: [] };
  }
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var s = JSON.parse(raw); if (s && s.v === 2) return s; } } catch (e) {}
    return ONLINE ? seedLive() : seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  S = load();
  if (!ONLINE && S.open && S.open.salud === undefined) S.open.salud = true;
  if (ONLINE && S.restCache && S.restCache.length) Array.prototype.splice.apply(RESTAURANTS, [0, RESTAURANTS.length].concat(S.restCache));
  else if (ONLINE) RESTAURANTS.length = 0;
  var ui = { cat: null, q: '', rtab: 'nuevos', bf: {}, rate: null, signup: null, choose: {}, lastRoute: '', installEvt: null };

  function order(id) { for (var i = 0; i < S.orders.length; i++) if (S.orders[i].id === id) return S.orders[i]; return null; }
  function rider(id) { return S.riders[id] || null; }
  function riderOf(o) { return o && o.riderId && o.riderId !== 'yo' ? (S.riders[o.riderId] || (o.rider ? { id: o.riderId, name: o.rider.name, phone: o.rider.phone, vehicle: o.rider.vehicle } : null)) : null; }
  function restRating(r) { var x = S.ratings[r.id]; return x ? x : { rating: r.rating, count: r.count }; }
  function ratingTxt(r) { var x = restRating(r); return x.count ? x.rating.toFixed(1).replace('.', ',') + ' (' + x.count + ')' : 'Nuevo'; }
  function riderBusy(id) { return S.orders.some(function (o) { return o.riderId === id && o.status === 'en_camino'; }); }
  // When is a rider on a delivery expected back? Sent time + ride there and back (~20 km/h in town) + 5 min at the door.
  function riderBack(id) {
    var os = S.orders.filter(function (o) { return o.riderId === id && o.status === 'en_camino'; });
    if (!os.length) return null;
    var best = 0;
    os.forEach(function (o) {
      var r = R(o.restId), d = hasLoc(r) && o.geo ? km(r, o.geo) * 1.3 : 1.5;
      var mins = Math.max(8, Math.round(d / 20 * 60 * 2 + 5));
      best = Math.max(best, (o.sentAt || o.acceptedAt || o.createdAt || now()) + mins * 60000);
    });
    return best;
  }
  function riderStatus(id, compact) {
    var back = riderBack(id);
    if (!back) return '<span class="rstat free"><span class="glow"></span>Libre</span>';
    var m = Math.round((back - now()) / 60000);
    if (compact) return '<span class="rstat busy" title="Vuelve ~' + hora(back) + '">' + ic('bike', 14) + '<span><b>En ruta</b><br>' + (m > 0 ? '~' + m + ' min' : 'ya casi') + '</span></span>';
    return '<span class="rstat busy">' + ic('bike', 14) + '<span><b>En ruta' + (m > 0 ? ' · ' + m + ' min' : '') + '</b><br>' + (m > 0 ? 'libre ~' + hora(back) : 'debería volver ya') + '</span></span>';
  }
  // Shops: the "cart" is a free order (typed list and/or photo) instead of dishes.
  function cartShop() { return !!S.cart.restId && isShop(R(S.cart.restId)); }
  function wishHas() { return cartShop() && (String(S.cart.wish || '').trim().length >= 2 || !!S.cart.wishImg); }
  function cartLines() {
    if (!S.cart.restId || cartShop()) return [];
    var r = R(S.cart.restId);
    return r.dishes.filter(function (d) { return S.cart.items[d.id] > 0; }).map(function (d) { return { id: d.id, name: d.name, price: d.price, qty: S.cart.items[d.id], img: d.img }; });
  }
  function cartCount() { if (cartShop()) return wishHas() ? 1 : 0; return cartLines().reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartSubtotal() { return cartLines().reduce(function (a, l) { return a + l.qty * l.price; }, 0); }
  function cartFee() { return S.cart.restId && S.cart.mode === 'dom' ? R(S.cart.restId).fee : 0; }
  // ---------- Map: pin + delivery zone ----------
  var TOWN = { lat: 4.6075, lng: -72.9289 }; // Villanueva, Casanare
  function km(a, b) {
    var rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }
  function hasLoc(r) { return r && typeof r.lat === 'number' && typeof r.lng === 'number'; }
  // null = fine (or unknown), otherwise distance in km beyond the restaurant's zone
  function tooFar(r, g) { if (!hasLoc(r) || !g) return null; var d = km(r, g); return d > (r.radius || 3) ? d : null; }
  function kmTxt(d) { return (Math.round(d * 10) / 10).toString().replace('.', ',') + ' km'; }
  function mapsLink(g) { return 'https://www.google.com/maps/search/?api=1&query=' + g.lat + ',' + g.lng; }
  function loadLeaflet(cb) {
    if (window.L) return cb();
    var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = BASE + 'vendor/leaflet/leaflet.css'; document.head.appendChild(c);
    var sc = document.createElement('script'); sc.src = BASE + 'vendor/leaflet/leaflet.js'; sc.onload = cb; sc.onerror = function () { toast('No se pudo abrir el mapa. Revisa tu internet.'); }; document.head.appendChild(sc);
  }
  // opts: { title, sub, start, zone: {lat,lng,radius}, onPick(pos) }
  function openMap(opts) {
    sheet('<div class="t-h2">' + opts.title + '</div><div class="small muted mt4">' + (opts.sub || 'Mueve el mapa hasta que el pin quede encima.') + '</div>' +
      '<div class="map-wrap mt12"><div id="pmap"></div><div class="map-pin">' + ic('pin', 40, { fill: true, sw: 1.5 }) + '</div></div>' +
      '<div id="mapMsg" class="small mt8 center muted"></div>' +
      '<button class="btn btn-outline btn-block mt8" data-a="mapGps">' + ic('map', 18) + ' Usar mi ubicación (GPS)</button>' +
      '<button class="btn btn-primary btn-block mt8" data-a="mapOk">Confirmar aquí</button>');
    ui.mapPick = opts;
    loadLeaflet(function () {
      var el = document.getElementById('pmap'); if (!el || !window.L) return;
      var st = opts.start || TOWN;
      var m = L.map(el, { zoomControl: true, attributionControl: true }).setView([st.lat, st.lng], opts.start ? 17 : 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      if (opts.zone && hasLoc(opts.zone)) L.circle([opts.zone.lat, opts.zone.lng], { radius: (opts.zone.radius || 3) * 1000, color: '#1F4D3A', weight: 2, fillOpacity: 0.06 }).addTo(m);
      var upd = function () {
        var msg = document.getElementById('mapMsg'); if (!msg || !opts.zone) return;
        var c = m.getCenter(), d = tooFar(opts.zone, { lat: c.lat, lng: c.lng });
        msg.innerHTML = d ? '<b style="color:#B02E1D">Fuera de la zona de entrega (' + kmTxt(d) + ')</b>' : '';
      };
      m.on('moveend', upd); upd();
      ui.map = m;
      setTimeout(function () { m.invalidateSize(); }, 200);
    });
  }

  // ---------- UI helpers ----------
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function go(path) { if (location.hash === '#' + path) render(); else location.hash = path; }
  function sheet(html) {
    var root = document.getElementById('sheet-root');
    if (!html) { var had = root.innerHTML; root.innerHTML = ''; if (had && ui.pendingRender) setTimeout(render, 0); return; }
    root.innerHTML = '<div class="sheet-bg" data-a="closeSheet"><div class="sheet" data-stop="1"><div class="grab"></div>' + html + '</div></div>';
    var f = root.querySelector('input,textarea'); if (f && !('ontouchstart' in window)) f.focus();
  }
  function topbar(title, back, sub, right) {
    return '<div class="topbar">' + (back ? '<a class="icon-btn" href="#' + back + '" aria-label="Volver">' + ic('back', 22) + '</a>' : '') +
      '<div class="grow">' + (sub ? '<div class="small muted">' + sub + '</div>' : '') + '<h1 class="t-title">' + title + '</h1></div>' + (right || '') + '</div>';
  }
  function tabs(kind, active) {
    var T = {
      cliente: [['inicio', 'home', 'Inicio', '/inicio'], ['buscar', 'search', 'Buscar', '/buscar'], ['pedidos', 'receipt', 'Pedidos', '/pedidos'], ['perfil', 'user', 'Perfil', '/perfil']],
      rest: [['pedidos', 'receipt', 'Pedidos', '/rest']].concat(ONLINE ? [['menu', 'store', isShop(R(S.restId)) ? 'Mi tienda' : 'Menú', '/rest/menu']] : [], [['riders', 'bike', 'Domiciliarios', '/rest/domiciliarios'], ['bolsa', 'users', 'Bolsa', '/rest/bolsa'], ['salir', 'swap', 'Cambiar rol', '/']]),
      dom: [['msgs', 'msg', 'Mensajes', '/dom'], ['perfil', 'user', 'Mi perfil', '/dom/perfil'], ['salir', 'swap', 'Cambiar rol', '/']],
      promo: [['enlace', 'qr', 'Mi enlace', '/promo'], ['ganancias', 'chart', 'Ganancias', '/promo/ganancias'], ['salir', 'swap', 'Cambiar rol', '/']]
    }[kind];
    var dot = '';
    return '<nav class="tabbar">' + T.map(function (t) {
      var on = t[0] === active;
      var badge = '';
      if (kind === 'cliente' && t[0] === 'pedidos') { var n = S.orders.filter(function (o) { return o.mine && ['recibido', 'preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0; }).length; if (n) badge = '<span class="dot">' + n + '</span>'; }
      if (kind === 'rest' && t[0] === 'pedidos') { var m = S.orders.filter(function (o) { return o.restId === S.restId && o.status === 'recibido'; }).length; if (m) badge = '<span class="dot">' + m + '</span>'; }
      return '<a href="#' + t[3] + '" class="' + (on ? 'on' : '') + '">' + ic(t[1], 24, { fill: false, sw: on ? 2.4 : 2 }) + badge + '<span>' + t[2] + '</span></a>';
    }).join('') + dot + '</nav>';
  }
  // Cerrados sin venta: no cuentan comisión ni gastan el premio.
  var CLOSED_BAD = ['rechazado', 'cancelado', 'no_entregado', 'sin_respuesta'];
  // Sin respuesta en 15 min (o 20 min antes de la hora programada) se cierra solo; abierto 3 h después de aceptado cuenta como entregado (015-cierre.sql).
  var NO_RESP_MIN = 15, AUTO_H = 3;
  function noRespAt(o) { return o.scheduledFor ? o.scheduledFor - 20 * 60000 : (o.createdAt || now()) + NO_RESP_MIN * 60000; }
  function autoAt(o) { return (o.scheduledFor || o.acceptedAt || o.createdAt || now()) + AUTO_H * 3600000; }
  var STATUS_TXT = { recibido: 'Recibido', preparando: 'Preparando', listo: 'Listo', en_camino: 'En camino', entregado: 'Entregado', rechazado: 'Rechazado', cancelado: 'Cancelado', no_entregado: 'No entregado', sin_respuesta: 'Sin respuesta' };
  function statusBadge(o) {
    var cls = { recibido: 'orange', preparando: 'amber', listo: 'amber', en_camino: 'route', entregado: 'green', rechazado: 'red', cancelado: 'grey', no_entregado: 'red', sin_respuesta: 'grey' }[o.status];
    var txt = o.status === 'listo' ? (o.mode === 'rec' ? 'Listo para recoger' : 'Listo') : STATUS_TXT[o.status];
    return '<span class="badge ' + cls + '">' + txt + '</span>';
  }
  function unpriced(o) { return !!o.wish && o.status === 'recibido'; }
  function payTxt(o) {
    if (unpriced(o)) return o.pay === 'ef' ? 'Efectivo' + (o.cashGiven ? ' · paga con billete de ' + fmt(o.cashGiven) : '') : (o.pay === 'nequi' ? 'Nequi' : 'Daviplata') + ' · transferencia';
    if (o.pay === 'ef') return 'Efectivo ' + fmt(o.total) + (o.cashGiven > o.total ? ' · paga con ' + fmt(o.cashGiven) + ' · vueltas ' + fmt(o.cashGiven - o.total) : ' · exacto');
    return (o.pay === 'nequi' ? 'Nequi ' : 'Daviplata ') + fmt(o.total) + ' · transferencia';
  }
  // ---------- Premio: cada 5º pedido por la app, $2.000 menos (lo paga Pido y Ido) ----------
  // Online lo calcula el servidor (supabase/006-clientes-fieles.sql); sin ese paso, el premio no se muestra.
  function reward() {
    if (ONLINE) return S.reward || null;
    var mine = S.orders.filter(function (o) { return o.mine; });
    var normal = mine.filter(function (o) { return o.status === 'entregado' && !o.discount; }).length;
    var used = mine.filter(function (o) { return o.discount > 0 && CLOSED_BAD.indexOf(o.status) < 0; }).length;
    var st = Math.max(normal - used * 4, 0);
    return { every: 5, amount: 2000, min: 10000, stamps: st, ready: st >= 4 };
  }
  function cartDiscount() { var rw = reward(); return rw && rw.ready && !cartShop() && cartSubtotal() >= rw.min ? rw.amount : 0; }
  function stampCard(cls) {
    var rw = reward(); if (!rw) return '';
    var n = Math.min(rw.stamps, 4), dots = '';
    for (var i = 0; i < 4; i++) dots += '<i class="' + (i < n ? 'on' : '') + '">' + (i < n ? ic('check', 16, { sw: 3 }) : i + 1) + '</i>';
    dots += '<i class="gift' + (rw.ready ? ' on' : '') + '">' + ic('gift', 18) + '</i>';
    return '<div class="card stamp-card ' + (cls || '') + '"><div class="row between"><div class="b">' + (rw.ready ? '¡Tu próximo pedido tiene ' + fmt(rw.amount) + ' de descuento!' : 'Tu 5º pedido: ' + fmt(rw.amount) + ' menos') + '</div></div>' +
      '<div class="stamps mt8">' + dots + '</div>' +
      '<div class="xs muted mt8">' + (rw.ready ? 'Se aplica solo al pagar, en pedidos desde ' + fmt(rw.min) + '.' : 'Llevas ' + n + ' de 4 sellos. Cada pedido entregado por la app suma uno.') + ' Solo pidiendo por Pido y Ido.</div>' +
      (needLogin() ? '<a class="xs link mt8" style="display:inline-block" href="#/cuenta">' + ic('lock', 12) + ' Confirma tu número para no perder tus sellos</a>' : '') + '</div>';
  }
  // WhatsApp avisos desde el número de Pido y Ido (cuando esté activado en config.js).
  // ---------- Pedir de nuevo y favoritos ----------
  // Pedidos entregados de este cliente, sin repetir el mismo pedido (mismo negocio y mismos platos), del más reciente al más viejo.
  function orderSig(o) { return o.restId + '|' + (o.wish ? 'w:' + o.wish : o.items.map(function (i) { return i.id + 'x' + i.qty; }).sort().join(',')); }
  function againList(max) {
    var seen = {}, out = [];
    S.orders.forEach(function (o) {
      if (!o.mine || o.status !== 'entregado' || out.length >= (max || 6)) return;
      var r = R(o.restId); if (!r.id || shown().indexOf(r) < 0) return;
      var k = orderSig(o); if (seen[k]) return; seen[k] = 1; out.push(o);
    });
    return out;
  }
  // Lo que cuesta hoy repetir ese pedido (precios del menú actual) y qué ya no está en el menú.
  function againCheck(o) {
    var r = R(o.restId), ok = [], gone = [], sub = 0;
    if (o.wish) return { ok: [], gone: [], sub: 0, total: 0, changed: false };
    o.items.forEach(function (i) {
      var d = r.dishes.filter(function (x) { return x.id === i.id; })[0];
      if (d) { ok.push({ id: d.id, qty: i.qty, name: d.name, img: d.img }); sub += d.price * i.qty; } else gone.push(i.name);
    });
    var fee = o.mode === 'dom' ? r.fee || 0 : 0, old = o.items.reduce(function (a, i) { return a + i.price * i.qty; }, 0);
    return { ok: ok, gone: gone, sub: sub, total: sub + fee, changed: !gone.length && sub !== old };
  }
  function againCard(o) {
    var r = R(o.restId), c = againCheck(o), d = c.ok[0];
    var pic = o.wish ? cover(r, 'again-ph') : photo(d && d.img ? d.img : r.img, 'again-ph');
    var what = o.wish ? (o.wish === '(Ver la foto)' ? 'Tu lista en foto' : String(o.wish).replace(/\s*\n+\s*/g, ', ')) : o.items.map(function (i) { return i.qty + '× ' + i.name; }).join(', ');
    var off = !o.wish && !c.ok.length;
    return '<div class="again">' + pic + '<div class="again-b"><div class="b ellipsis">' + esc(r.short || r.name) + '</div><div class="xs muted again-what">' + esc(what) + '</div>' +
      '<div class="row between mt8" style="gap:6px"><span class="small b">' + (o.wish ? 'Precio al confirmar' : fmt(c.total)) + '</span>' +
      '<button class="btn btn-primary btn-xs" data-a="reorder" data-id="' + o.id + '"' + (off ? ' disabled' : '') + '>' + ic('refresh', 15, { sw: 2.4 }) + 'Pedir</button></div></div></div>';
  }
  function isFav(id) { return !!(S.favs && S.favs[id]); }
  function favBtn(r) { var on = isFav(r.id); return '<button class="icon-btn fav' + (on ? ' on' : '') + '" data-a="fav" data-id="' + esc(r.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Quitar de favoritos' : 'Guardar en favoritos') + '">' + ic('heart', 20, { fill: on }) + '</button>'; }
  function waOn() { return !ONLINE || !!(window.PYI_CONFIG || {}).whatsappAvisos; }
  // Nequi del negocio para este pedido (online: solo después de que aceptan) y su teléfono si lo lleva el mismo negocio.
  function contactFor(o) {
    var r = R(o.restId);
    if (!ONLINE) return { nequi: r.nequi, phone: r.phone };
    ui.ct = ui.ct || {};
    var k = o.dbId + ':' + o.status + ':' + (o.riderId || '');
    if (!(k in ui.ct)) {
      ui.ct[k] = null;
      if (['preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0 && CLOUD.orderContact) {
        CLOUD.orderContact(o.dbId).then(function (c) { ui.ct[k] = c || {}; safeRender(); }, function () { ui.ct[k] = {}; safeRender(); });
      } else ui.ct[k] = {};
    }
    var c = ui.ct[k] || {};
    return { nequi: c.nequi || r.nequi || '', phone: c.phone || r.phone || '', loading: ui.ct[k] === null };
  }
  function itemsTxt(o) { if (o.wish) return o.wish === '(Ver la foto)' ? 'Lista en foto' : String(o.wish).replace(/\s*\n+\s*/g, ', ') + (o.wishImg ? ' + foto' : ''); return o.items.map(function (i) { return i.qty + '× ' + i.name; }).join(', '); }

  // ---------- Screens: start ----------
  function installCard() {
    var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) return '';
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return '<div class="card mt12"><div class="row top"><div class="icon-btn green">' + ic('install', 20) + '</div><div class="grow"><div class="b">Instálala como app</div>' +
      (ui.installEvt ? '<div class="small muted mt4">Queda en tu pantalla de inicio, como cualquier app.</div><button class="btn btn-green btn-sm mt8" data-a="install">Instalar Pido y Ido</button>'
        : ios ? '<div class="small muted mt4">En Safari toca <b>Compartir</b> (el cuadro con la flecha) y luego <b>Agregar a inicio</b>.</div>'
          : '<div class="small muted mt4">En Chrome abre el menú <b>⋮</b> y toca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</div>') +
      '</div></div></div>';
  }
  var ROLES = [
    { id: 'cliente', icon: 'bag', title: 'Quiero pedir comida', sub: 'Restaurantes de tu barrio', cta: 'Empezar a pedir', home: '/inicio' },
    { id: 'rest', icon: 'store', title: 'Tengo un negocio', sub: 'Restaurante, droguería, tienda…', cta: 'Registrar mi negocio', home: '/rest', first: '/rest/registro' },
    { id: 'rider', icon: 'bike', title: 'Soy domiciliario', sub: 'Encuentra restaurantes que te contraten', cta: 'Crear mi perfil', home: '/dom', first: '/dom/perfil' },
    { id: 'promo', icon: 'gift', title: 'Quiero recomendar y ganar', sub: 'Comparte tu enlace y gana', cta: 'Obtener mi enlace', home: '/promo' }
  ];
  function roleById(id) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === id) return ROLES[i]; return ROLES[0]; }
  function scrStart() {
    var sel = ui.rolePick || S.role || 'cliente';
    var cur = roleById(sel);
    return '<div class="welcome"><div class="welcome-hero">' + photo(IMG.asado, '', 'position:absolute;inset:0;height:100%;width:100%') +
      '<div class="welcome-fade"></div><div class="welcome-brand">' + logo(36, 'icon') + '<span>Pido y Ido</span></div>' +
      '<div class="welcome-title"><h1>La comida de Villanueva, a tu puerta</h1><div class="muted" style="font-size:15px">¿Cómo quieres usar la app?</div></div></div>' +
      '<div class="welcome-roles">' + ROLES.map(function (r) {
        var on = r.id === sel;
        return '<button class="role-card' + (on ? ' on' : '') + '" data-a="rolePick" data-v="' + r.id + '"><span class="ic">' + ic(r.icon, 22, { sw: 1.75 }) + '</span><span class="grow"><span class="rt">' + r.title + '</span><span class="rs">' + r.sub + (r.id === 'promo' ? ' ' + S.promo.pct + '%' : '') + '</span></span><span class="ring"></span></button>';
      }).join('') + '</div>' +
      '<div class="welcome-cta"><button class="btn btn-primary btn-block" style="height:58px;font-size:17px;font-weight:600" data-a="roleGo">' + cur.cta + '</button>' +
      (ONLINE ? '<a class="welcome-login" href="#/rest/login">¿Tienes negocio? <b>Iniciar sesión</b></a>' +
      '<div class="xs muted center"><a class="link" href="#/legal/terminos">Términos</a> · <a class="link" href="#/legal/privacidad">Privacidad</a></div>'
        : '<button class="welcome-login" data-a="login">¿Ya tienes cuenta? <b>Iniciar sesión</b></button>' +
      '<div class="xs muted center">Prototipo de demostración: los datos quedan solo en este celular.</div>') + '</div></div>';
  }
  function scrRestRegistro() {
    if (ONLINE) return scrRestRegistroLive();
    var f = ui.reg || (ui.reg = { name: '', phone: '', addr: '' });
    return '<div class="screen has-cta" style="padding-bottom:calc(170px + var(--safe-b))">' + topbar('Registra tu restaurante', '/', 'Gratis para empezar') +
      '<div class="muted small" style="margin-top:-6px">En 10 minutos recibes pedidos. Nosotros pasamos tu menú a la app con una foto de la carta.</div>' +
      '<div class="card mt16"><div class="field"><label class="label" for="rg1">Nombre del restaurante</label><input class="input" id="rg1" data-m="ui.reg.name" value="' + esc(f.name) + '" placeholder="Asadero El Llanero"></div>' +
      '<div class="field"><label class="label" for="rg2">WhatsApp del negocio</label><input class="input" id="rg2" data-m="ui.reg.phone" inputmode="tel" value="' + esc(f.phone) + '" placeholder="310 000 0000"></div>' +
      '<div class="field"><label class="label" for="rg3">Dirección</label><input class="input" id="rg3" data-m="ui.reg.addr" value="' + esc(f.addr) + '" placeholder="Calle 10 # 8-24, El Centro"></div>' +
      '<label class="photo-up mt12' + (f.menu ? ' done' : '') + '" style="width:100%">' + ic(f.menu ? 'check' : 'camera', 18) + (f.menu ? 'Foto de la carta agregada' : 'Foto de tu carta (opcional)') + '<input type="file" accept="image/*" data-file="menu"></label></div>' +
      '<div class="note amber mt12">En la demo te mostramos el panel de <b>Asadero El Llanero</b> con pedidos de ejemplo, para que veas cómo funciona.</div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="regDo">Ver mi panel</button><a class="btn btn-ghost btn-block" style="height:44px" href="#/rest">Saltar</a></div>';
  }

  // ---------- Restaurant account (online): branded header, steps, inputs with icons ----------
  function authHero(kicker, title, back, tag) {
    return '<div class="auth-hero">' + photo(IMG.asado, '', 'position:absolute;inset:0;height:100%;width:100%') + '<div class="auth-fade"></div>' +
      '<div class="auth-top">' + (back ? '<a class="icon-btn glass" href="#' + back + '" aria-label="Volver">' + ic('back', 22) + '</a>' : '') +
      '<span class="auth-brand">' + logo(30, 'icon') + 'Pido y Ido <span class="auth-tag">' + (tag || 'Restaurantes') + '</span></span></div>' +
      '<div class="auth-title"><div class="auth-kicker">' + kicker + '</div><h1>' + title + '</h1></div></div>';
  }
  function steps(list, at) {
    return '<div class="steps">' + list.map(function (t, i) {
      return '<div class="step' + (i < at ? ' done' : i === at ? ' on' : '') + '"><span class="n">' + (i < at ? ic('check', 12, { sw: 3.2 }) : i + 1) + '</span><span class="t">' + t + '</span></div>';
    }).join('<span class="step-line"></span>') + '</div>';
  }
  function fieldIc(id, label, icon, input, hint, prefix) {
    return '<div class="field"><label class="label" for="' + id + '">' + label + '</label><div class="input-ic">' + ic(icon, 18) + (prefix ? '<span class="pre">' + prefix + '</span>' : '') + input + '</div>' + (hint ? '<div class="xs muted mt4">' + hint + '</div>' : '') + '</div>';
  }
  var SETUP_STEPS = ['Cuenta', 'Menú', 'Ubicación', 'Abrir'], SHOP_STEPS = ['Cuenta', 'Tu tienda', 'Ubicación', 'Abrir'];
  function scrRestRegistroLive() {
    var f = ui.reg || (ui.reg = { kind: 'restaurante', name: '', phone: '', addr: '', pass: '' });
    if (!f.town) f.town = hasTown() ? myTown() : LIVE_TOWN;
    var logged = !!CLOUD.restUid(), err = ui.regErr || {}, k = kindOf(f), shop = isShop(f);
    var perks = [['bell', 'Los pedidos te llegan al celular, con sonido'], ['bike', 'Despachas con tus propios domiciliarios'], shop ? ['list', 'Sin menú: el cliente escribe su lista y tú pones el precio'] : ['clock', 'Listo en 10 minutos, sin papeleo']];
    return '<div class="screen flush has-cta auth" style="padding-bottom:calc(150px + var(--safe-b))">' + authHero('Gratis para empezar', logged ? 'Completa tu negocio' : 'Vende a domicilio en ' + esc(f.town), '/', 'Negocios') +
      '<div class="auth-body">' + steps(shop ? SHOP_STEPS : SETUP_STEPS, 0) +
      '<div class="label mt16">¿Qué tipo de negocio tienes?</div><div class="kinds">' + KINDS.map(function (x) {
        return '<button class="kind' + (x.id === k.id ? ' on' : '') + '" data-a="regKind" data-v="' + x.id + '" aria-pressed="' + (x.id === k.id) + '"><span class="ki kt-' + x.id + '">' + ic(x.icon, 20, { sw: 1.8 }) + '</span><span>' + x.t + '</span></button>';
      }).join('') + '</div>' +
      (logged ? '' : '<div class="perks mt16">' + perks.map(function (p) { return '<div class="perk"><span class="pi">' + ic(p[0], 18) + '</span>' + p[1] + '</div>'; }).join('') + '</div>') +
      '<div class="card mt16">' +
      fieldIc('rg1', 'Nombre del negocio', k.icon, '<input class="input' + (err.name ? ' err' : '') + '" id="rg1" data-m="ui.reg.name" value="' + esc(f.name) + '" placeholder="' + esc(k.ex) + '" autocomplete="organization">') +
      (logged ? '' : fieldIc('rg2', 'WhatsApp del negocio', 'msg', '<input class="input' + (err.phone ? ' err' : '') + '" id="rg2" data-m="ui.reg.phone" inputmode="tel" value="' + esc(f.phone) + '" placeholder="310 000 0000" autocomplete="tel-national">', 'Con este número entras a tu panel.', '+57')) +
      fieldIc('rgT', 'Pueblo', 'map', '<input class="input' + (err.town ? ' err' : '') + '" id="rgT" data-m="ui.reg.town" value="' + esc(f.town) + '" list="rgTowns" autocomplete="off"><datalist id="rgTowns">' + allTowns().map(function (t) { return '<option value="' + esc(t) + '">'; }).join('') + '</datalist>') +
      fieldIc('rg3', 'Dirección', 'pin', '<input class="input' + (err.addr ? ' err' : '') + '" id="rg3" data-m="ui.reg.addr" value="' + esc(f.addr) + '" placeholder="Calle 10 # 8-24, El Centro" autocomplete="street-address">') +
      (logged ? '' : fieldIc('rg4', 'Crea una clave', 'lock', '<input class="input' + (err.pass ? ' err' : '') + '" id="rg4" data-m="ui.reg.pass" type="password" autocomplete="new-password" value="' + esc(f.pass) + '" placeholder="Mínimo 6 letras o números">')) +
      (ui.regMsg ? '<div class="err-msg">' + esc(ui.regMsg) + '</div>' : '') + '</div>' +
      legalCheck(!!f.legal, 'regLegal', 'Acepto los <a class="link" href="#/legal/terminos">términos para negocios</a> y la <a class="link" href="#/legal/privacidad">política de datos</a>.', err.legal) +
      (logged ? '' : '<div class="small muted center mt16">¿Ya tienes cuenta? <a class="link" href="#/rest/login">Inicia sesión</a></div>') + '</div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="regDo"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Un momento…' : logged ? 'Crear mi negocio' : 'Crear mi cuenta') + (ui.busy ? '' : ic('right', 20)) + '</button></div>';
  }
  function scrRestLogin() {
    var f = ui.login || (ui.login = { phone: '', pass: '' });
    return '<div class="screen flush has-cta auth">' + authHero('Panel de tu negocio', 'Hola de nuevo', '/', 'Negocios') +
      '<div class="auth-body"><div class="card">' +
      fieldIc('lg1', 'WhatsApp del negocio', 'msg', '<input class="input" id="lg1" data-m="ui.login.phone" inputmode="tel" autocomplete="username" value="' + esc(f.phone) + '" placeholder="310 000 0000">', '', '+57') +
      fieldIc('lg2', 'Clave', 'lock', '<input class="input" id="lg2" data-m="ui.login.pass" type="password" autocomplete="current-password" data-enter="restLoginDo" value="' + esc(f.pass) + '" placeholder="Tu clave">') +
      (ui.loginMsg ? '<div class="err-msg">' + esc(ui.loginMsg) + '</div>' : '') + '</div>' +
      '<div class="card flat mt16 row"><span class="pi">' + ic('store', 18) + '</span><div class="grow small">¿Aún no estás en Pido y Ido?<br><a class="link" href="#/rest/registro">Registra tu negocio gratis</a></div></div>' +
      '<div class="small center mt16"><a class="link" href="#/rest/clave">¿Olvidaste tu clave?</a></div></div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="restLoginDo"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Entrando…' : 'Entrar') + '</button></div>';
  }
  // Página de Pido y Ido (#/admin/<clave>): ver todos los negocios y ocultar uno falso. 018-sin-revision.sql.
  function scrAdmin(key) {
    var A2 = ui.admin && ui.admin.key === key ? ui.admin : (ui.admin = { key: key, list: null, q: '', err: '' });
    if (!A2.list && !A2.loading && !A2.err) {
      A2.loading = true;
      CLOUD.adminSettings(key).then(function (st) { st = st || {}; A2.auto = !!st.auto_visible; if ('need_phone' in st) { A2.need = !!st.need_phone; A2.wa = !!st.whatsapp_listo; A2.cods = st.codigos_30d; A2.codsBad = st.codigos_fallidos_30d; } render(); }, function () {});
      CLOUD.adminList(key).then(function (l) { A2.loading = false; A2.list = l || []; render(); },
        function (e) { A2.loading = false; A2.err = /not_admin/.test(String(e && e.message)) ? 'Este enlace no es válido.' : errTxt(e); render(); });
    }
    var tab = A2.tab || 'neg';
    var h = '<div class="screen">' + topbar(tab === 'cli' ? 'Clientes' : 'Negocios', '/', 'Pido y Ido · solo para ti');
    if (A2.err) return h + '<div class="empty">' + esc(A2.err) + '</div></div>';
    h += '<div class="chips mt4"><button class="chip' + (tab === 'neg' ? ' on' : '') + '" data-a="adminTab" data-v="neg">Negocios</button><button class="chip' + (tab === 'cli' ? ' on' : '') + '" data-a="adminTab" data-v="cli">Clientes</button></div>';
    if (tab === 'cli') {
      if (A2.need != null) h += '<div class="card mt12 row" style="gap:12px"><div class="grow"><div class="b">Pedir número confirmado</div><div class="xs muted mt4">' +
        (A2.need ? 'Solo piden clientes que confirmaron su número por WhatsApp.' : 'Cualquiera puede pedir. Actívalo cuando WhatsApp funcione.') +
        (A2.wa != null ? '<br>WhatsApp: ' + (A2.wa ? 'listo' : '<b>falta configurar</b>') + ' · ' + (A2.cods || 0) + ' códigos en 30 días' + (A2.codsBad ? ' · ' + A2.codsBad + ' fallidos' : '') : '') + '</div></div>' +
        '<button class="toggle" data-a="adminNeed" style="background:' + (A2.need ? 'var(--gtint)' : 'var(--track)') + ';color:' + (A2.need ? 'var(--green)' : 'var(--muted)') + '">' + (A2.need ? 'Sí' : 'No') +
        '<span class="tr" style="background:' + (A2.need ? 'var(--green)' : '#C9C1B7') + ';--k:' + (A2.need ? '19px' : '3px') + '"></span></button></div>';
      return h + (A2.cli ? admCliente(A2, A2.cli) : admClientes(A2)) + '</div>';
    }
    if (!A2.list) return h + '<div class="empty">Cargando…</div></div>';
    var q = A2.q.toLowerCase(), list = A2.list.filter(function (r) { return !q || (r.name + ' ' + (r.town || '') + ' ' + (r.phone || '')).toLowerCase().indexOf(q) >= 0; });
    var hid = A2.list.filter(function (r) { return !r.visible; }).length;
    h += (A2.auto == null ? '' : '<div class="card row" style="gap:12px"><div class="grow"><div class="b">Negocios nuevos</div><div class="xs muted mt4">' +
        (A2.auto ? 'Salen de una vez. Tú puedes ocultar uno después.' : 'Esperan a que tú toques «Mostrar».') + '</div></div>' +
        '<button class="toggle" data-a="adminAuto" style="background:' + (A2.auto ? 'var(--gtint)' : 'var(--track)') + ';color:' + (A2.auto ? 'var(--green)' : 'var(--muted)') + '">' + (A2.auto ? 'Automático' : 'A mano') +
        '<span class="tr" style="background:' + (A2.auto ? 'var(--green)' : '#C9C1B7') + ';--k:' + (A2.auto ? '19px' : '3px') + '"></span></button></div>') +
      '<div class="small muted mt12">' + A2.list.length + ' negocios' + (hid ? ' · ' + hid + ' sin mostrar' : '') + '</div>' +
      '<input class="input mt12" data-m="ui.admin.q" data-enter="adminFind" value="' + esc(A2.q) + '" placeholder="Buscar por nombre, pueblo o número">';
    h += list.map(function (r) {
      var k = KINDS.filter(function (x) { return x.id === r.kind; })[0] || KINDS[0];
      return '<div class="card mt12' + (r.visible ? '' : ' adm-off') + '"><div class="row between" style="gap:10px;align-items:flex-start"><div class="grow"><div class="b">' + esc(r.name) + '</div>' +
        '<div class="xs muted mt4">' + esc(k.t) + ' · ' + esc(r.town || '') + ' · desde ' + new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + '</div>' +
        '<div class="xs muted">' + r.dishes + ' platos · ' + r.pedidos + ' pedidos · ' + r.entregados + ' entregados' + (r.open ? ' · abierto' : '') + '</div></div>' +
        '<button class="btn btn-sm ' + (r.visible ? 'btn-ghost' : 'btn-green') + '" data-a="adminToggle" data-v="' + esc(r.id) + '">' + (r.visible ? 'Ocultar' : 'Mostrar') + '</button></div>' +
        (r.phone ? '<a class="link small mt8" style="display:inline-block" target="_blank" rel="noopener" href="' + waLink(r.phone) + '">' + ic('msg', 14) + ' ' + phoneFmt(r.phone) + '</a>' : '') + '</div>';
    }).join('');
    return h + '</div>';
  }
  // ---------- Cuenta del cliente: número confirmado con código por WhatsApp (019-cuenta-whatsapp.sql) ----------
  // Se activa con loginWhatsapp: true en config.js, cuando el número de Pido y Ido en WhatsApp esté listo.
  function loginOn() { return ONLINE && !!(window.PYI_CONFIG || {}).loginWhatsapp; }
  function needLogin() { return loginOn() && !S.custPhone; }
  function scrCuenta(query) {
    var next = (query && query.next) || '/perfil';
    var f = ui.cuenta || (ui.cuenta = { phone: String(S.user.phone || '').replace(/\D/g, '').slice(-10), code: '', step: 1, msg: '' });
    var h = '<div class="screen flush has-cta auth">' + authHero('Tu cuenta', S.custPhone ? 'Tu número está confirmado' : 'Confirma tu número', next, 'Clientes') + '<div class="auth-body">';
    if (S.custPhone) {
      return h + '<div class="card row" style="gap:12px;align-items:flex-start"><span class="pi" style="background:var(--gtint);color:var(--green)">' + ic('check', 18, { sw: 3 }) + '</span><div class="grow"><div class="b">' + phoneFmt(S.custPhone) + '</div>' +
        '<div class="xs muted mt4">Tus pedidos y sellos quedan guardados en este número. Si cambias de celular, entra con el mismo número y los recuperas.</div></div></div>' +
        '<button class="btn btn-ghost btn-block mt16" data-a="cuentaSalir">Salir de esta cuenta</button>' +
        '<div class="xs muted center mt8">Solo si este celular lo usa otra persona.</div></div></div>' +
        '<div class="cta-wrap"><a class="btn btn-primary btn-xl btn-block" href="#' + esc(next) + '">Listo</a></div>';
    }
    h += '<div class="card">';
    if (f.step === 1) {
      h += '<div class="small">Te mandamos un código por <b>WhatsApp</b>. Así tus sellos y pedidos quedan en tu número y no los pierdes si cambias de celular.</div>' +
        fieldIc('cu1', 'Tu celular (WhatsApp)', 'msg', '<input class="input" id="cu1" data-m="ui.cuenta.phone" inputmode="tel" autocomplete="tel" data-enter="cuentaEnviar" value="' + esc(f.phone) + '" placeholder="310 000 0000">', '', '+57');
    } else {
      h += '<div class="small">Escribe el código de 6 números que te llegó por WhatsApp al <b>' + phoneFmt(f.phone) + '</b>.</div>' +
        fieldIc('cu2', 'Código', 'lock', '<input class="input" id="cu2" data-m="ui.cuenta.code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" data-enter="cuentaVerificar" value="' + esc(f.code) + '" placeholder="000000" style="letter-spacing:6px;font-size:20px">') +
        '<div class="row between mt8 small"><button class="link" data-a="cuentaCambiar">Cambiar número</button>' +
        (f.sentAt && now() - f.sentAt < 60000 ? '<span class="muted">Reenviar en ' + Math.ceil((60000 - (now() - f.sentAt)) / 1000) + ' s</span>' : '<button class="link" data-a="cuentaEnviar">Reenviar código</button>') + '</div>';
    }
    if (f.msg) h += '<div class="err-msg">' + esc(f.msg) + '</div>';
    h += '</div><div class="xs muted center mt16">Usamos tu número solo para tus pedidos. <a class="link" href="#/legal/privacidad">Tus datos y privacidad</a></div></div></div>';
    var btn = f.step === 1 ? ['cuentaEnviar', ui.busy ? 'Enviando…' : 'Enviar código por WhatsApp'] : ['cuentaVerificar', ui.busy ? 'Revisando…' : 'Confirmar'];
    return h + '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="' + btn[0] + '" data-next="' + esc(next) + '"' + (ui.busy ? ' disabled' : '') + '>' + btn[1] + '</button></div>';
  }
  function cuentaCard() {
    if (!loginOn()) return '';
    if (S.custPhone) return '<a class="card mt12 row" href="#/cuenta" style="gap:12px"><span class="pi" style="background:var(--gtint);color:var(--green)">' + ic('check', 18, { sw: 3 }) + '</span><div class="grow"><div class="b">Número confirmado</div><div class="xs muted mt4">Tus sellos y pedidos están guardados en ' + phoneFmt(S.custPhone) + '.</div></div>' + ic('right', 18) + '</a>';
    return '<a class="card mt12 row" href="#/cuenta" style="gap:12px;align-items:flex-start"><span class="pi">' + ic('lock', 18) + '</span><div class="grow"><div class="b">Guarda tus sellos en tu número</div><div class="xs muted mt4">Confírmalo una vez con un código por WhatsApp. Si cambias de celular, no pierdes nada.</div><span class="btn btn-green btn-sm mt8">Confirmar mi número</span></div></a>';
  }
  // Pido y Ido: historia de cada cliente por número (pedidos, cancelados, no pagó, reclamos).
  function admClientes(A2) {
    if (!A2.cl && !A2.clLoading && !A2.clErr) {
      A2.clLoading = true;
      CLOUD.adminClientes(A2.key).then(function (l) { A2.clLoading = false; A2.cl = l || []; render(); },
        function (e) { A2.clLoading = false; A2.clErr = /admin_clientes/.test(String(e && e.message)) ? 'Falta pegar 019-cuenta-whatsapp.sql en Supabase.' : errTxt(e); render(); });
    }
    if (A2.clErr) return '<div class="empty">' + esc(A2.clErr) + '</div>';
    if (!A2.cl) return '<div class="empty">Cargando…</div>';
    var q = (A2.cq || '').toLowerCase(), qd = q.replace(/\D/g, '');
    var list = A2.cl.filter(function (c) { return !q || (qd && c.phone.indexOf(qd) >= 0) || String(c.name || '').toLowerCase().indexOf(q) >= 0; });
    var h = '<div class="small muted mt12">' + A2.cl.length + ' clientes · primero los que tienen más problemas</div>' +
      '<input class="input mt12" data-m="ui.admin.cq" data-enter="adminFind" value="' + esc(A2.cq || '') + '" placeholder="Buscar por número o nombre">';
    if (qd.length === 10 && !list.length) h += '<button class="card mt12 row" style="width:100%;text-align:left" data-a="adminCli" data-v="' + qd + '"><div class="grow b">Ver ' + phoneFmt(qd) + '</div>' + ic('right', 18) + '</button>';
    return h + list.slice(0, 100).map(function (c) {
      var bad = [c.cancelados ? c.cancelados + ' cancelado' + (c.cancelados > 1 ? 's' : '') : '', c.no_entregados ? c.no_entregados + ' sin entregar' : '', c.no_pago ? c.no_pago + ' no pagó' : '', c.reclamos ? c.reclamos + ' reclamo' + (c.reclamos > 1 ? 's' : '') : ''].filter(Boolean).join(' · ');
      return '<button class="card mt12' + (c.bloqueado ? ' adm-off' : '') + '" style="width:100%;text-align:left" data-a="adminCli" data-v="' + esc(c.phone) + '"><div class="row between" style="gap:10px"><div class="grow"><div class="b">' + esc(c.name || 'Sin nombre') + (c.bloqueado ? ' · <span style="color:#A1291B">bloqueado</span>' : '') + '</div>' +
        '<div class="xs muted mt4">' + phoneFmt(c.phone) + ' · ' + (c.confirmado ? '✓ confirmado' : 'sin confirmar') + ' · último ' + new Date(c.ultimo).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + '</div>' +
        '<div class="xs mt4">' + c.pedidos + ' pedidos · ' + c.entregados + ' entregados' + (bad ? ' · <b style="color:#A1291B">' + bad + '</b>' : '') + '</div></div>' + ic('right', 18) + '</div></button>';
    }).join('');
  }
  function admCliente(A2, phone) {
    var d = A2.det && A2.det.phone === phone ? A2.det : null;
    if (!d && !A2.detLoading) {
      A2.detLoading = true;
      CLOUD.adminCliente(A2.key, phone).then(function (x) { A2.detLoading = false; A2.det = x; render(); }, function (e) { A2.detLoading = false; toast(errTxt(e)); });
    }
    var h = '<button class="link small" data-a="adminCliBack">' + ic('back', 14) + ' Todos los clientes</button>';
    if (!d) return h + '<div class="empty">Cargando…</div>';
    var ps = d.pedidos || [], cnt = function (f) { return ps.filter(f).length; };
    var nombres = ps.map(function (o) { return o.name; }).filter(function (n, i, a) { return n && a.indexOf(n) === i; });
    h += '<div class="card mt12"><div class="t-h3">' + esc(nombres[0] || 'Cliente') + '</div>' +
      '<div class="small mt4"><a class="link" target="_blank" rel="noopener" href="' + waLink(d.phone) + '">' + ic('msg', 14) + ' ' + phoneFmt(d.phone) + '</a></div>' +
      '<div class="xs muted mt4">' + (d.cuenta && d.cuenta.desde ? '✓ Número confirmado por WhatsApp desde ' + new Date(d.cuenta.desde).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Número sin confirmar (lo escribió el cliente)') + '</div>' +
      (nombres.length > 1 ? '<div class="xs muted mt4">Otros nombres usados: ' + esc(nombres.slice(1).join(', ')) + '</div>' : '') +
      '<div class="adm-stats mt12">' + [[ps.length, 'pedidos'], [cnt(function (o) { return o.status === 'entregado'; }), 'entregados'], [cnt(function (o) { return o.status === 'cancelado'; }), 'cancelados'],
        [cnt(function (o) { return o.status === 'no_entregado' && !/^Tuvimos que cancelarlo/.test(o.reason || ''); }), 'sin entregar'], [cnt(function (o) { return o.no_pago; }), 'no pagó'], [cnt(function (o) { return o.issue; }), 'reclamos']].map(function (x) {
        return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>' +
      (d.bloqueo ? '<div class="note amber mt12"><b>Bloqueado</b> desde ' + new Date(d.bloqueo.at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + (d.bloqueo.reason ? ': ' + esc(d.bloqueo.reason) : '') + '. No puede hacer pedidos.</div>' : '') +
      '<button class="btn btn-sm btn-block mt12 ' + (d.bloqueo ? 'btn-green' : 'btn-outline') + '" data-a="adminBlock">' + (d.bloqueo ? 'Desbloquear' : 'Bloquear este número') + '</button></div>';
    h += '<div class="t-h3 mt16">Pedidos</div>' + ps.map(function (o) {
      var bad = o.status !== 'entregado' && o.status !== 'recibido' && o.status !== 'preparando' && o.status !== 'listo' && o.status !== 'en_camino';
      return '<div class="card mt8"><div class="row between"><div class="b">#' + String(o.id).padStart(4, '0') + ' · ' + esc(o.rest || '') + '</div><div class="b">' + fmt(o.total) + '</div></div>' +
        '<div class="xs muted mt4">' + new Date(o.at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + ' · ' + ({ ef: 'Efectivo', nequi: 'Nequi', davi: 'Daviplata' }[o.pay] || o.pay) + (o.phone_ok ? ' · ✓ número' : '') + '</div>' +
        '<div class="small mt4" style="color:' + (bad || o.no_pago ? '#A1291B' : 'var(--green)') + '"><b>' + esc(STATUS_TXT[o.status] || o.status) + '</b>' + (o.no_pago ? ' · no pagó' : '') + (o.reason ? ' · ' + esc(o.reason) : '') + '</div>' +
        (o.issue ? '<div class="xs mt4"><b>Reclamo:</b> ' + esc(o.issue) + (o.issue_note ? ' · ' + esc(o.issue_note) : '') + '</div>' : '') +
        (o.rating ? '<div class="xs mt4" style="color:var(--orange)">' + '★★★★★'.slice(0, o.rating) + '</div>' : '') +
        (o.address ? '<div class="xs muted mt4">' + esc(o.address) + '</div>' : '') + '</div>';
    }).join('');
    return h;
  }
  function supportWa() { return String((window.PYI_CONFIG || {}).soporteWhatsapp || '').replace(/\D/g, ''); }
  // Clave olvidada: WhatsApp + código de recuperación + clave nueva (017-lanzamiento.sql).
  function scrRestClave() {
    var f = ui.clave || (ui.clave = { phone: (ui.login && ui.login.phone) || '', code: '', pass: '' }), sup = supportWa();
    return '<div class="screen flush has-cta auth">' + authHero('Panel de tu negocio', 'Crea una clave nueva', '/rest/login', 'Negocios') +
      '<div class="auth-body"><div class="card">' +
      fieldIc('cl1', 'WhatsApp del negocio', 'msg', '<input class="input" id="cl1" data-m="ui.clave.phone" inputmode="tel" autocomplete="username" value="' + esc(f.phone) + '" placeholder="310 000 0000">', '', '+57') +
      fieldIc('cl2', 'Código de recuperación', 'lock', '<input class="input" id="cl2" data-m="ui.clave.code" autocapitalize="characters" autocomplete="one-time-code" value="' + esc(f.code) + '" placeholder="Ej.: K7PQ2MXA">', 'Te lo mostramos cuando creaste tu cuenta.') +
      fieldIc('cl3', 'Clave nueva', 'lock', '<input class="input" id="cl3" data-m="ui.clave.pass" type="password" autocomplete="new-password" data-enter="claveDo" value="' + esc(f.pass) + '" placeholder="Mínimo 6 letras o números">') +
      (ui.claveMsg ? '<div class="err-msg">' + esc(ui.claveMsg) + '</div>' : '') + '</div>' +
      '<div class="xs muted center mt16">¿No tienes el código? ' + (sup ? '<a class="link" target="_blank" rel="noopener" href="' + waLink(sup, 'Hola, olvidé la clave de mi negocio en Pido y Ido.') + '">Escríbele a Pido y Ido</a> y te ayudamos.' : 'Escríbele a Pido y Ido y te ayudamos.') + '</div></div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="claveDo"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Un momento…' : 'Guardar clave nueva') + '</button></div>';
  }
  // Política de datos (Ley 1581 de 2012) y términos. Los datos del responsable vienen de config.js (legal).
  function scrLegal(which) {
    var L = (window.PYI_CONFIG || {}).legal || {}, sup = supportWa();
    var quien = (L.responsable ? esc(L.responsable) : 'Pido y Ido') + (L.documento ? ', ' + esc(L.documento) : '') + (L.direccion ? ', ' + esc(L.direccion) : '');
    var contacto = [L.correo ? 'correo <b>' + esc(L.correo) + '</b>' : '', sup ? 'WhatsApp <b>' + phoneFmt(sup.slice(-10)) + '</b>' : ''].filter(Boolean).join(' o ') || 'los canales de contacto de Pido y Ido';
    var sec = function (t, body) { return '<div class="card mt12"><div class="t-h3">' + t + '</div><div class="small mt8 legal-txt">' + body + '</div></div>'; };
    var priv = which !== 'terminos';
    var h = '<div class="screen">' + topbar(priv ? 'Tus datos y privacidad' : 'Términos de uso', '/', 'Pido y Ido') +
      '<div class="chips mt4"><a class="chip' + (priv ? ' on' : '') + '" href="#/legal/privacidad">Privacidad</a><a class="chip' + (priv ? '' : ' on') + '" href="#/legal/terminos">Términos</a></div>';
    if (priv) {
      h += sec('Quién trata tus datos', 'Responsable: ' + quien + '. Contacto para todo lo relacionado con tus datos: ' + contacto + '. Esta política cumple la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).') +
        sec('Qué datos guardamos', '<b>Clientes:</b> nombre, celular, dirección de entrega, el punto que marcas en el mapa, tus pedidos, calificaciones y reclamos. Si confirmas tu número, guardamos que lo confirmaste y cuándo (el código de WhatsApp vence en minutos y no lo guardamos). No pedimos cédula ni correo. No guardamos datos de tarjetas: el pago es en efectivo o por transferencia directa al negocio.<br><b>Negocios:</b> nombre, WhatsApp, dirección, ubicación, menú, fotos, horario, número de Nequi y sus domiciliarios (nombre y celular).<br><b>Domiciliarios en la bolsa:</b> lo que tú publicas (nombre, celular, barrio, vehículo, horario).') +
        sec('Para qué los usamos', 'Solo para: (1) que el negocio reciba, prepare y entregue tu pedido; (2) mostrarte el estado del pedido y tu historial; (3) el premio de cliente fiel; (4) atender reclamos; (5) calcular la comisión de los negocios; (6) evitar fraudes y pedidos falsos: Pido y Ido revisa el historial de pedidos de cada número (entregados, cancelados, sin pagar y reclamos) y puede bloquear un número que abusa; (7) mandarte por WhatsApp el código para confirmar tu número. No vendemos tus datos ni te enviamos publicidad sin tu permiso.') +
        sec('Quién más los ve', 'El negocio al que le pides ve tu nombre, celular, dirección y pedido. El domiciliario que el negocio elige ve tu nombre, dirección y el valor a cobrar. Los datos se guardan con proveedores de tecnología (Supabase, servidores en la Unión Europea; Meta/WhatsApp, que recibe tu número para mandarte el código; y GitHub para la página), que solo los guardan por encargo nuestro. Al aceptar, autorizas esa transmisión internacional.') +
        sec('Tus derechos', 'Puedes conocer, actualizar, corregir y pedir que borremos tus datos, saber cómo los usamos, revocar tu autorización y quejarte ante la Superintendencia de Industria y Comercio (SIC). Escríbenos por ' + contacto + '. Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles.') +
        sec('Cuánto tiempo', 'Mientras uses la app y hasta 5 años después del último pedido, por obligaciones contables y para atender reclamos. Después los borramos. La app no está dirigida a menores de 18 años.') +
        '<div class="xs muted center mt16">Vigente desde el 23 de noviembre de 2026.</div>';
    } else {
      h += sec('Qué es Pido y Ido', 'Pido y Ido es una herramienta tecnológica que conecta a clientes con negocios de su pueblo. ' + quien + ' opera la app. <b>Pido y Ido no vende los productos, no fija precios y no contrata ni maneja domiciliarios.</b>') +
        sec('El negocio responde por', 'Sus productos, precios, calidad, la factura cuando aplique, los tiempos y la entrega. El negocio elige y paga a sus propios domiciliarios. Ante cualquier problema con un pedido, usa «¿Algo salió mal?» o escríbele al negocio; el negocio debe responder según el Estatuto del Consumidor (Ley 1480 de 2011).') +
        sec('Pagos', 'Pagas directo al negocio, en efectivo o por transferencia (Nequi u otra). Pido y Ido no recibe tu dinero. Revisa el total antes de pagar.') +
        sec('Cancelaciones', 'Puedes cancelar mientras el negocio no haya aceptado el pedido. Las tiendas te muestran el precio antes de preparar y puedes cancelar si no estás de acuerdo. Si el negocio no responde en 15 minutos, el pedido se cierra solo.') +
        sec('Uso correcto', 'No hagas pedidos falsos ni dejes de pagar pedidos entregados. Para evitar abusos hay un límite de pedidos abiertos por persona, y los negocios ven si un cliente tuvo pedidos sin pagar. Te podemos pedir que confirmes tu celular con un código por WhatsApp. Tu cuenta es tu número: no compartas el código con nadie. Podemos bloquear el número de quien abuse.') +
        sec('Para negocios', 'Registrarse es gratis. Pido y Ido puede revisar los negocios nuevos antes de mostrarlos y ocultar un negocio con datos falsos, quejas repetidas o que no cumpla estos términos. La comisión es la acordada (hoy 5% de cada pedido entregado, sin el domicilio), se cobra fuera de la app y puede cambiar con aviso de 30 días. El negocio cuida su clave y su código de recuperación, mantiene su menú, precios y horario al día, y trata los datos de sus clientes solo para entregar los pedidos.') +
        sec('Cambios y contacto', 'Si cambiamos estos términos, lo avisamos en la app. Contacto: ' + contacto + '.') +
        '<div class="xs muted center mt16">Vigente desde el 23 de noviembre de 2026.</div>';
    }
    return h + '</div>';
  }
  function scrLoading(title) {
    return '<div class="screen">' + topbar(title || 'Pido y Ido', '/') + '<div class="skel" style="height:150px"></div><div class="skel mt12" style="height:18px;width:60%"></div><div class="skel mt8" style="height:14px;width:40%"></div><div class="skel mt20" style="height:150px"></div><div class="skel mt12" style="height:18px;width:55%"></div><div class="sr-only">Cargando…</div></div>';
  }

  // ---------- Customer ----------
  function restCard(r) {
    var open = abierto(r);
    return '<a class="rest-card' + (open ? '' : ' closed') + '" href="#/r/' + r.id + '"><div style="position:relative">' + cover(r, '', 'height:168px;width:100%') +
      (isShop(r) ? '<span class="over kind-over">' + ic(kindOf(r).icon, 14, { sw: 2.2 }) + kindOf(r).t + '</span>' : '') +
      (r.fee === 0 ? '<span class="over" style="left:12px;top:12px;background:var(--green);color:#fff">Domicilio gratis</span>' : '') +
      '<span class="over" style="right:12px;bottom:12px;background:#fff">' + r.eta + '</span>' +
      (open ? '' : '<div class="closed-veil"><span>' + (estadoTxt(r).indexOf('abre ') > 0 ? capi(estadoTxt(r).replace('Cerrado · ', '')) : progOn() ? 'Cerrado · puedes programar' : 'Cerrado ahora') + '</span></div>') +
      '</div><div style="padding:12px 14px"><div class="row between"><div class="t-h3 ellipsis">' + r.name + '</div><div class="small b" style="flex:none"><span style="color:var(--orange)">★</span> ' + ratingTxt(r) + '</div></div>' +
      '<div class="small muted mt4">' + esc(r.sub || kindOf(r).t) + (r.min && !isShop(r) ? ' · Mín. ' + fmt(r.min) : '') + (r.fee ? ' · Domicilio ' + fmt(r.fee) : '') + '</div>' +
      (r.horario && open ? '<div class="xs mt4 row open-line" style="gap:5px">' + ic('clock', 12) + estadoTxt(r) + '</div>' : '') + '</div></a>';
  }
  function cartBar(above) {
    var n = cartCount(); if (!n) return '';
    if (cartShop()) return '<div class="cta-wrap' + (above ? ' above-tabs' : '') + '"><a class="cart-bar" href="#/confirmar"><span class="c">' + ic('list', 16, { sw: 2.4 }) + '</span><span class="grow">Continuar · ' + esc(R(S.cart.restId).short) + '</span>' + ic('right', 20) + '</a></div>';
    return '<div class="cta-wrap' + (above ? ' above-tabs' : '') + '"><a class="cart-bar" href="#/confirmar"><span class="c">' + n + '</span><span class="grow">Ver carrito · ' + R(S.cart.restId).short + '</span><span>' + fmt(cartSubtotal()) + '</span></a></div>';
  }
  function scrInicio() {
    if (!hasTown()) return scrPueblo(true);
    if (ONLINE && !ui.synced) return scrLoading('Pido y Ido');
    if (!isLive(myTown())) return scrInicioPronto();
    var active = S.orders.filter(function (o) { return o.mine && ['recibido', 'preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0; })[0];
    var here = shownHere(), shops = here.filter(isShop), pr = prontoHere(), prShops = pr.filter(isShop), tiendas = (shops.length || prShops.length) && ui.home === 'tiendas';
    var base = here.filter(function (r) { return isShop(r) === !!tiendas; });
    var list = base.filter(function (r) { return tiendas ? (!ui.kind || r.kind === ui.kind) : (!ui.cat || r.cats.indexOf(ui.cat) >= 0); });
    var openN = base.filter(abierto).length;
    list.sort(function (a, b) { return (abierto(b) ? 1 : 0) - (abierto(a) ? 1 : 0); });
    var h = '<div class="screen has-tabs' + (cartCount() ? ' has-cta' : '') + '">' +
      '<div class="row">' + logo(40, 'mark') + '<button class="grow" style="text-align:left" data-a="editAddress"><div class="xs muted">Entregar en</div><div class="b row" style="gap:4px;font-size:15px"><span class="ellipsis">' + (S.user.address ? esc(S.user.address.split(',')[0]) + ', ' + esc(myTown()) : esc(myTown()) + ' · Agrega tu dirección') + '</span>' + ic('down', 16) + '</div></button>' +
      '<a class="icon-btn" href="#/confirmar" aria-label="Carrito" style="position:relative">' + ic('bag', 20) + (cartCount() ? '<span style="position:absolute;top:-2px;right:-2px;background:var(--cta);color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">' + cartCount() + '</span>' : '') + '</a></div>' +
      '<h1 class="t-title mt16" style="font-size:28px">' + (tiendas ? '¿Qué necesitas hoy' : '¿Qué se te antoja hoy') + (S.user.name ? ', ' + esc(first(S.user.name)) : '') + '?</h1>' +
      '<a class="search mt16" href="#/buscar">' + ic('search', 20) + '<span class="muted">' + (tiendas ? 'Busca droguerías, minimercados…' : 'Busca empanadas, pizza, arepas…') + '</span></a>' +
      (shops.length || prShops.length ? '<div class="seg home-seg mt16"><button class="' + (tiendas ? '' : 'on') + '" data-a="homeTab" data-v="comida">' + ic('utensils', 17) + 'Comida</button><button class="' + (tiendas ? 'on' : '') + '" data-a="homeTab" data-v="tiendas">' + ic('basket', 17) + 'Tiendas</button></div>' : '');
    if (active) {
      h += '<a class="card mt16 row" href="#/pedido/' + active.id + '" style="border:2px solid var(--green)"><span class="pulse"></span><div class="grow"><div class="b">Pedido #' + active.id + ' · ' + R(active.restId).short + '</div><div class="small muted">' + statusLine(active) + '</div></div>' + ic('right', 20) + '</a>';
    }
    if (!ui.cat && !tiendas) h += stampCard('mt16');
    if (tiendas) {
      var kinds = KINDS.filter(function (k) { return shops.concat(prShops).some(function (r) { return r.kind === k.id; }); });
      if (kinds.length > 1) h += '<div class="chips scroll mt16">' + kinds.map(function (k) { return '<button class="chip' + (ui.kind === k.id ? ' on' : '') + '" data-a="kindPick" data-v="' + k.id + '">' + ic(k.icon, 16) + k.t + '</button>'; }).join('') + '</div>';
    } else h += '<div class="cats mt16">' + catList().map(function (c) {
      return '<button class="cat' + (ui.cat === c[0] ? ' on' : '') + '" data-a="cat" data-v="' + esc(c[0]) + '">' + photo(c[1]) + '<span>' + esc(c[0]) + '</span></button>';
    }).join('') + '</div>';
    if (!ui.cat && !ui.kind) {
      var again = againList(6).filter(function (o) { return isShop(R(o.restId)) === !!tiendas; });
      if (again.length) h += '<div class="row between mt20"><div class="t-h2">Pedir de nuevo</div><a class="small muted" href="#/pedidos">Ver todos</a></div><div class="again-row mt12">' + again.map(againCard).join('') + '</div>';
      var favs = here.filter(function (r) { return isFav(r.id) && isShop(r) === !!tiendas; });
      if (favs.length) h += '<div class="t-h2 mt20">Tus favoritos</div><div class="chips scroll mt12">' + favs.map(function (r) { return '<a class="chip fav-chip" href="#/r/' + r.id + '">' + cover(r, 'fav-ph') + esc(r.short || r.name) + (abierto(r) ? '' : ' <span class="xs muted">· cerrado</span>') + '</a>'; }).join('') + '</div>';
    }
    var filt = tiendas ? ui.kind && kindOf({ kind: ui.kind }).t : ui.cat;
    h += '<div class="row between mt24"><div class="t-h2">' + (filt || (tiendas ? 'Tiendas cerca' : 'Cerca de ti')) + '</div><div class="small muted">' + (filt ? '<button class="link" data-a="' + (tiendas ? 'kindPick' : 'cat') + '" data-v="">Ver todos</button>' : openN + ' abiertos') + '</div></div><div class="mt12">' +
      (tiendas ? '<div class="note green row" style="gap:10px;margin-bottom:12px">' + ic('list', 18) + '<span>Escribe tu lista o mándale una foto. La tienda te confirma el precio.</span></div>' : '') +
      (list.length ? list.map(restCard).join('') : '<div class="empty">' + (ui.cat && !tiendas ? 'Todavía no hay restaurantes con ' + ui.cat + '.' : ONLINE && !ui.synced ? 'Cargando restaurantes…' : tiendas ? 'Todavía no hay tiendas en Pido y Ido.' : 'Pronto vas a ver aquí los restaurantes de Villanueva.') + '</div>') + '</div>' +
      prontoSection(pr.filter(function (p) { return tiendas ? isShop(p) && (!ui.kind || p.kind === ui.kind) : !isShop(p) && (!ui.cat || p.cats.indexOf(ui.cat) >= 0); }), tiendas) + '</div>';
    return h + cartBar(true) + tabs('cliente', 'inicio');
  }
  function searchResults() {
    var q = ui.q.trim().toLowerCase();
    if (!q) return '<div class="small muted mt16">Prueba: carne, pizza, empanadas, jugo…</div>' + '<div class="chips mt12">' + ['Carne', 'Pizza', 'Empanadas', 'Hamburguesa', 'Jugo'].map(function (s) { return '<button class="chip" data-a="qset" data-v="' + s + '">' + s + '</button>'; }).join('') + '</div>';
    var out = [];
    shownHere().forEach(function (r) {
      if (r.name.toLowerCase().indexOf(q) >= 0 || r.sub.toLowerCase().indexOf(q) >= 0 || (isShop(r) && kindOf(r).t.toLowerCase().indexOf(q) >= 0)) out.push('<a class="list-row" href="#/r/' + r.id + '">' + cover(r, 'thumb') + '<div class="grow"><div class="b">' + r.name + '</div><div class="small muted">' + kindOf(r).t + ' · ' + r.eta + '</div></div>' + ic('right', 18) + '</a>');
      r.dishes.forEach(function (d) {
        if ((d.name + ' ' + d.desc).toLowerCase().indexOf(q) >= 0) out.push('<a class="list-row" href="#/r/' + r.id + '">' + photo(d.img, 'thumb') + '<div class="grow"><div class="b">' + d.name + '</div><div class="small muted">' + r.short + ' · ' + fmt(d.price) + '</div></div>' + ic('right', 18) + '</a>');
      });
    });
    var later = pronto().filter(function (p) { return (p.name + ' ' + p.sub + ' ' + p.cats.join(' ')).toLowerCase().indexOf(q) >= 0; });
    if (later.length) return (out.length ? '<div class="card mt16" style="padding:4px 14px">' + out.join('') + '</div>' : '<div class="small muted mt16">No encontramos “' + esc(ui.q) + '” en Pido y Ido todavía.</div>') +
      '<div class="label" style="margin-top:20px">Aún no están en Pido y Ido</div><div class="card mt8 pr-list">' + later.slice(0, 8).map(prontoRow).join('') + '</div>' +
      '<div class="small muted mt8">¿Te gusta alguno? Invítalo por WhatsApp: inscribirse es gratis.</div>' + sugLink(ui.q);
    return (out.length ? '<div class="card mt16" style="padding:4px 14px">' + out.join('') + '</div>' : '<div class="empty">No encontramos “' + esc(ui.q) + '”.</div>') + sugLink(ui.q);
  }
  function scrBuscar() {
    return '<div class="screen has-tabs">' + topbar('Buscar') + '<label class="search">' + ic('search', 20) + '<input id="q" type="search" placeholder="Busca empanadas, pizza, arepas…" value="' + esc(ui.q) + '" data-live="q" autocomplete="off"></label><div id="results">' + searchResults() + '</div></div>' + cartBar(true) + tabs('cliente', 'buscar');
  }
  function dishQty(r, d) { return S.cart.restId === r.id ? (S.cart.items[d.id] || 0) : 0; }
  function qtyCtl(r, d) {
    var q = dishQty(r, d);
    return q ? '<div class="qty has"><button data-a="dec" data-r="' + r.id + '" data-d="' + d.id + '" aria-label="Quitar">' + ic('minus', 18) + '</button><span class="n">' + q + '</span><button data-a="add" data-r="' + r.id + '" data-d="' + d.id + '" aria-label="Agregar">' + ic('plus', 18) + '</button></div>'
      : '<div class="qty"><button data-a="add" data-r="' + r.id + '" data-d="' + d.id + '" aria-label="Agregar ' + esc(d.name) + '">' + ic('plus', 20) + '</button></div>';
  }
  function dishRow(r, d) {
    return '<div class="dish"><button class="grow dish-txt" data-a="dishView" data-r="' + r.id + '" data-d="' + d.id + '">' + (d.top ? '<span class="badge orange" style="margin-bottom:6px">Más pedido</span>' : '') + '<div class="b" style="font-size:15px">' + esc(d.name) + '</div><div class="small muted mt4">' + esc(d.desc || '') + '</div><div class="b mt8">' + fmt(d.price) + '</div></button>' +
      '<div class="ph" style="width:96px;height:96px"><button class="imgwrap" data-a="dishView" data-r="' + r.id + '" data-d="' + d.id + '" aria-label="Ver foto de ' + esc(d.name) + '">' + (d.img ? '<img src="' + esc(imgSrc(d.img, 240)) + '" alt="" loading="lazy" decoding="async" onerror="this.classList.add(\'broken\')" style="width:100%;height:100%;object-fit:cover">' : '') + '</button>' +
      qtyCtl(r, d) + '</div></div>';
  }
  // Hoja con la foto grande del plato.
  function dishSheet(r, d) {
    var q = dishQty(r, d);
    return '<div class="dish-big">' + (d.img ? '<img src="' + esc(imgSrc(d.img, 900)) + '" alt="' + esc(d.name) + '" decoding="async" onerror="this.classList.add(\'broken\')">' : '') + '<button class="icon-btn dish-x" data-a="closeSheet" aria-label="Cerrar">' + ic('x', 20) + '</button></div>' +
      '<div class="mt16">' + (d.top ? '<span class="badge orange" style="margin-bottom:6px">Más pedido</span>' : '') + '<div class="t-h2">' + esc(d.name) + '</div>' + (d.desc ? '<div class="muted mt4">' + esc(d.desc) + '</div>' : '') + '<div class="num mt8" style="font-size:20px">' + fmt(d.price) + '</div></div>' +
      (q ? '<div class="note green mt12 row between"><span>Ya tienes <b>' + q + '</b> en tu carrito</span><button class="link b" data-a="dishSheetDec" data-r="' + r.id + '" data-d="' + d.id + '">Quitar 1</button></div>' : '') +
      '<button class="btn btn-primary btn-block btn-xl mt16" data-a="dishSheetAdd" data-r="' + r.id + '" data-d="' + d.id + '">' + ic('plus', 18) + (q ? ' Agregar otro · ' : ' Agregar · ') + fmt(d.price) + '</button>';
  }
  function scrMenu(id, query) {
    var r = R(id);
    if (ONLINE && !r.id) return ui.synced ? '<div class="screen">' + topbar('Restaurante', '/inicio') + '<div class="empty">No encontramos este restaurante.</div></div>' : scrLoading('Restaurante');
    if (query && query.p) { S.ref = { slug: query.p, restId: id, at: now() }; save(); }
    if (isShop(r)) return scrShop(r);
    var open = abierto(r);
    var mode = S.cart.restId === r.id ? S.cart.mode : 'dom';
    var h = '<div class="screen flush' + (cartCount() ? ' has-cta' : '') + '"><div class="hero">' + photo(r.img, '', 'height:232px;width:100%') +
      '<a class="icon-btn back" href="#/inicio" aria-label="Volver">' + ic('back', 22) + '</a>' + favBtn(r) + '</div>' +
      '<div class="card raised info-card"><h1 class="t-title" style="font-size:24px">' + r.name + '</h1><div class="small muted mt4"><span style="color:var(--orange)">★</span> ' + ratingTxt(r) + ' · ' + r.eta + ' · Mín. ' + fmt(r.min) + '</div>' +
      '<div class="seg mt12"><button class="' + (mode === 'dom' ? 'on' : '') + '" data-a="mode" data-v="dom" data-r="' + r.id + '">Domicilio · ' + (r.fee ? fmt(r.fee) : 'gratis') + '</button><button class="' + (mode === 'rec' ? 'on' : '') + '" data-a="mode" data-v="rec" data-r="' + r.id + '">Recoger · ' + r.pickup + '</button></div>' +
      horarioLine(r) +
      (open ? '' : '<div class="note amber mt12"><b>' + punto(estadoTxt(r)) + '</b> ' + (progOn() ? 'Puedes pedir y programarlo para más tarde.' : 'Puedes mirar el menú, pero no recibe pedidos.') + '</div>') +
      (S.ref && S.ref.restId === r.id ? '<div class="note green mt12">Llegaste con el enlace de un vecino que recomienda este restaurante.</div>' : '') +
      '</div>';
    var secs = menuSecs(r.dishes);
    if (secs.length > 1) h += '<div class="sec-tabs" id="secTabs"><div class="chips scroll">' + secs.map(function (x, k) { return '<button class="chip sm' + (k === 0 ? ' on' : '') + '" data-a="secGo" data-v="' + k + '">' + esc(x.t) + ' <span class="sec-n">' + x.list.length + '</span></button>'; }).join('') + '</div></div>';
    h += '<div class="pad">';
    h += secs.map(function (x, k) {
      return '<div class="sec-block" id="sec' + k + '"><div class="t-h2 mt20">' + (secs.length > 1 ? esc(x.t) : 'Menú') + '</div><div class="mt12">' + x.list.map(function (d) { return dishRow(r, d); }).join('') + '</div></div>';
    }).join('');
    h += '<div>';
    if (!r.dishes.length) h += '<div class="empty">Este restaurante aún no tiene menú.</div>';
    h += '</div><div class="small muted mt16 center">' + esc(r.address) + '</div></div></div>';
    return h + cartBar(false);
  }
  // Shop page: no menu, the customer writes a list and/or adds a photo. The shop sets the price when it accepts.
  function wishUrl(path, asRest) {
    if (!path) return '';
    if (/^data:/.test(path)) return path;
    if (ui.wishPrev && ui.wishPrev.path === path) return ui.wishPrev.url;
    if (!ONLINE || !CLOUD.listUrl) return '';
    var c = (ui.signed = ui.signed || {})[path];
    if (c && c.exp > now()) return c.url;
    if (!c || !c.busy) {
      ui.signed[path] = { busy: true, exp: 0 };
      CLOUD.listUrl(path, asRest).then(function (u) { ui.signed[path] = { url: u, exp: now() + 50 * 60000 }; safeRender(); },
        function () { ui.signed[path] = { url: '', exp: now() + 60000 }; });
    }
    return '';
  }
  function wishPic(o, asRest) {
    var u = wishUrl(o.wishImg, asRest), link = u && !/^data:/.test(u);
    return '<a class="wish-pic"' + (link ? ' href="' + esc(u) + '" target="_blank" rel="noopener"' : '') + ' aria-label="Foto de la lista">' + (u ? '<img src="' + esc(u) + '" alt="">' : ic('camera', 22)) + '</a>';
  }
  function scrShop(r) {
    var open = abierto(r), k = kindOf(r), mine = S.cart.restId === r.id;
    var mode = mine ? S.cart.mode : 'dom';
    var other = S.cart.restId && !mine && cartCount() ? R(S.cart.restId) : null;
    var wish = mine ? (S.cart.wish || '') : '', img = mine ? S.cart.wishImg : '';
    var prev = img ? wishUrl(img, false) : '';
    var h = '<div class="screen flush has-cta"><div class="hero">' + cover(r, '', 'height:232px;width:100%') +
      '<a class="icon-btn back" href="#/inicio" aria-label="Volver">' + ic('back', 22) + '</a>' + favBtn(r) + '</div>' +
      '<div class="card raised info-card"><span class="badge green">' + ic(k.icon, 13, { sw: 2.4 }) + ' ' + k.t + '</span><h1 class="t-title mt8" style="font-size:24px">' + esc(r.name) + '</h1><div class="small muted mt4"><span style="color:var(--orange)">★</span> ' + ratingTxt(r) + ' · ' + r.eta + (r.sub ? ' · ' + esc(r.sub) : '') + '</div>' +
      '<div class="seg mt12"><button class="' + (mode === 'dom' ? 'on' : '') + '" data-a="mode" data-v="dom" data-r="' + r.id + '">Domicilio · ' + (r.fee ? fmt(r.fee) : 'gratis') + '</button><button class="' + (mode === 'rec' ? 'on' : '') + '" data-a="mode" data-v="rec" data-r="' + r.id + '">Recoger · ' + r.pickup + '</button></div>' +
      horarioLine(r) +
      (open ? '' : '<div class="note amber mt12"><b>' + punto(estadoTxt(r)) + '</b> ' + (progOn() ? 'Puedes enviar tu lista y programarla para más tarde.' : 'No recibe pedidos en este momento.') + '</div>') +
      (S.ref && S.ref.restId === r.id ? '<div class="note green mt12">Llegaste con el enlace de un vecino que recomienda esta tienda.</div>' : '') +
      '</div><div class="pad"><div class="card mt20"><div class="row" style="gap:12px"><span class="pi">' + ic('list', 18) + '</span><div class="grow"><div class="t-h3">¿Qué necesitas?</div><div class="small muted">Escribe tu pedido, una cosa por línea.</div></div></div>' +
      (other ? '<div class="note amber mt12">Tienes un carrito de <b>' + esc(other.short) + '</b>. Si escribes aquí, ese carrito se vacía.</div>' : '') +
      '<textarea class="input wish-in mt12" id="wish" rows="6" data-wish="' + r.id + '" placeholder="' + esc(k.ph || '') + '">' + esc(wish) + '</textarea>' +
      (img ? '<div class="wish-att mt12">' + (prev ? '<img src="' + esc(prev) + '" alt="">' : '<span class="pi">' + ic('check', 18) + '</span>') + '<div class="grow"><div class="b">Foto adjunta</div><div class="xs muted">' + esc(r.short) + ' la ve con tu pedido.</div></div><button class="icon-btn" style="width:40px;height:40px;box-shadow:none;background:var(--track)" data-a="wishImgDel" aria-label="Quitar foto">' + ic('x', 18) + '</button></div>'
        : '<label class="photo-up mt12" style="width:100%">' + ic(ui.upBusy ? 'refresh' : 'camera', 18) + (ui.upBusy ? 'Subiendo foto…' : k.id === 'drogueria' ? 'Foto de tu lista o fórmula' : 'Agregar una foto (opcional)') + '<input type="file" accept="image/*" data-file="wish" data-r="' + r.id + '"></label>') +
      (k.hint ? '<div class="note soft mt12">' + k.hint + '</div>' : '') + '</div>' +
      '<div class="how mt16">' + [['list', 'Escribes tu lista'], ['check', esc(r.short) + ' te confirma el precio'], ['wallet', 'Pagas al recibir']].map(function (x, i) {
        return '<div class="how-step"><span class="how-n">' + ic(x[0], 16, { sw: 2.2 }) + '</span><span class="small">' + x[1] + '</span></div>';
      }).join('') + '</div>' +
      '<div class="small muted mt16 center">' + esc(r.address) + '</div></div><div id="cbar">' + cartBar(false) + '</div></div>';
    return h;
  }
  function ensureWishCart(rid) { if (S.cart.restId !== rid) S.cart = { restId: rid, items: {}, mode: S.cart.restId === rid ? S.cart.mode : 'dom', wish: '', wishImg: '' }; }
  function uploadWish(file, rid) {
    if (ui.upBusy) return;
    ui.upBusy = true; render();
    shrinkPhoto(file, 'list').then(function (x) {
      if (!ONLINE) return { path: x.dataUrl, url: x.dataUrl };
      if (!CLOUD.uploadList) throw new Error('no_upload');
      return CLOUD.uploadList(x.blob).then(function (path) { return { path: path, url: x.dataUrl }; });
    }).then(function (res) {
      ui.upBusy = false; ensureWishCart(rid); S.cart.wishImg = res.path; ui.wishPrev = res; save(); render(); toast('Foto agregada');
    }, function (e) {
      ui.upBusy = false; render();
      toast(/bucket|not found|no_upload|row-level|policy/i.test(String(e && e.message)) ? 'Mandar fotos se activa muy pronto. Por ahora escribe tu lista.' : 'No se pudo subir la foto. Revisa tu internet.');
    });
  }
  // Efectivo: "pago exacto" o los billetes con los que paga (ej. 1 × $50.000 + 1 × $20.000).
  var BILLS = [100000, 50000, 20000, 10000, 5000, 2000];
  function billsSum() { var b = S.co.bills || {}, t = 0; BILLS.forEach(function (v) { t += v * (b[v] || 0); }); return t; }
  function billsTxt(b) { return BILLS.filter(function (v) { return b && b[v]; }).map(function (v) { return (b[v] > 1 ? b[v] + ' × ' : '') + fmt(v); }).join(' + '); }
  function cashBox(total, shop) {
    var exact = S.co.cash !== 'bills', sum = billsSum(), b = S.co.bills || {};
    var h = '<div class="seg mt16"><button class="' + (exact ? 'on' : '') + '" data-a="cash" data-v="exact">Pago exacto</button><button class="' + (exact ? '' : 'on') + '" data-a="cash" data-v="bills">Con billetes</button></div>';
    if (exact) return h + '<div class="xs muted mt8">' + (shop ? 'Tienes el valor justo cuando la tienda te diga el precio.' : 'Tienes listos ' + fmt(total) + ' justos.') + '</div>';
    h += '<div class="label mt12">¿Con qué billetes pagas? <span class="muted" style="font-weight:500">Toca para sumar</span></div><div class="bills">' + BILLS.map(function (v) {
      var n = b[v] || 0;
      return '<div class="bill' + (n ? ' on' : '') + '" data-b="' + v + '"><button class="bill-add" data-a="billAdd" data-v="' + v + '"><span class="bill-v">' + fmt(v).replace('.000', ' mil').replace('$', '$') + '</span>' + (n ? '<span class="bill-n">× ' + n + '</span>' : '') + '</button>' +
        (n ? '<button class="bill-dec" data-a="billDec" data-v="' + v + '" aria-label="Quitar un billete de ' + fmt(v) + '">' + ic('minus', 14) + '</button>' : '') + '</div>';
    }).join('') + '</div>';
    if (!sum) return h + '<div class="xs muted mt8">Así ' + (shop ? 'la tienda' : 'el domiciliario') + ' lleva las vueltas exactas.</div>';
    if (shop) return h + '<div class="note green mt12 row between b"><span>Pagas con ' + billsTxt(b) + '</span><span>' + fmt(sum) + '</span></div>';
    if (sum < total) return h + '<div class="note amber mt12 row between b"><span>Te faltan</span><span>' + fmt(total - sum) + '</span></div>';
    return h + '<div class="note green mt12"><div class="row between"><span>Pagas con</span><b>' + fmt(sum) + '</b></div><div class="row between b mt4"><span>Tus vueltas</span><span>' + fmt(sum - total) + '</span></div></div>';
  }
  // "¿Para cuándo?": lo antes posible o programado (hoy / mañana, dentro del horario del negocio).
  function whenCard(r) {
    if (!progOn()) return '';
    var co = S.co, open = abierto(r), s0 = slotsDe(r, 0), s1 = slotsDe(r, 1), all = s0.concat(s1);
    if (co.when && all.indexOf(co.when) < 0) co.when = null;
    var later = wantsLater(r), day = (co.day === 1 && s1.length) || !s0.length ? 1 : 0, list = day ? s1 : s0;
    var rec = S.cart.mode === 'rec';
    var h = '<div class="card mt12"><div class="row b" style="gap:8px;margin-bottom:12px"><span class="orange">' + ic('clock', 18) + '</span>¿Para cuándo?</div>' +
      '<button class="radio-row' + (later ? '' : ' on') + (open ? '' : ' off') + '" data-a="whenNow"' + (open ? '' : ' disabled') + '><span class="ring"></span><span class="grow"><span class="b" style="display:block">Lo antes posible</span><span class="small muted">' + (open ? (rec ? 'Listo en ' + esc(r.pickup) : 'Llega en ' + esc(r.eta)) : (r.horario ? estadoTxt(r) : 'Ahora está cerrado')) + '</span></span></button>' +
      '<button class="radio-row' + (later ? ' on' : '') + '" data-a="whenLater"><span class="ring"></span><span class="grow"><span class="b" style="display:block">Para más tarde</span><span class="small muted">' + (later && co.when ? capi(cuandoCo(co.when)) : 'Elige día y hora') + '</span></span></button>';
    if (later) {
      if (!all.length) return h + '<div class="note amber mt8">No quedan horas para programar hoy ni mañana.' + (r.horario ? ' ' + punto(estadoTxt(r)) : ' Horario: ' + horarioTxt(r) + '.') + '</div></div>';
      h += '<div class="seg mt8">' + (s0.length ? '<button class="' + (day === 0 ? 'on' : '') + '" data-a="whenDay" data-v="0">Hoy</button>' : '') + (s1.length ? '<button class="' + (day === 1 ? 'on' : '') + '" data-a="whenDay" data-v="1">Mañana</button>' : '') + '</div>' +
        '<div class="chips scroll mt12">' + list.map(function (t) { return '<button class="chip sm' + (co.when === t ? ' on' : '') + '" data-a="whenPick" data-v="' + t + '">' + horaCo(t) + '</button>'; }).join('') + '</div>' +
        '<div class="xs muted mt8">' + (rec ? 'Hora para recoger' : 'Hora de entrega aproximada') + '. Horario de ' + esc(r.short) + (day ? ' mañana: ' : ' hoy: ') + horarioTxt(r, dowCo(now() + day * 86400000)) + '.' + (open ? '' : ' ' + esc(r.short) + ' ve tu pedido cuando abra y lo acepta.') + '</div>';
    }
    return h + '</div>';
  }
  function ctaTxt(r, ok) {
    if (ui.busy) return 'Enviando pedido…';
    if (wantsLater(r)) return S.co.when ? 'Programar · ' + capi(cuandoCo(S.co.when)) : 'Elige la hora';
    return ok;
  }
  function ctaOff(r) { return wantsLater(r) ? !S.co.when : !abierto(r); }
  // Celular en el pedido: confirmado por WhatsApp (no se puede cambiar aquí) o escrito a mano.
  function phoneField(ac) {
    if (loginOn() && S.custPhone) return '<label class="label">Celular</label><a class="input row" href="#/cuenta?next=/confirmar" style="gap:6px;text-decoration:none;color:inherit"><span class="grow">' + phoneFmt(S.custPhone) + '</span><span style="color:var(--green)">' + ic('check', 16, { sw: 3 }) + '</span></a>';
    var cc = S.user.cc || '57';
    return '<label class="label" for="ph">Celular</label><div class="tel-row"><label class="tel-cc"><span>' + ccFlag(cc) + ' +' + cc + '</span>' + ic('down', 14) +
      '<select data-a-change="cc" aria-label="País del celular">' + PAISES.map(function (x) { return '<option value="' + x[1] + '"' + (x[1] === cc ? ' selected' : '') + '>' + x[0] + ' ' + x[2] + ' (+' + x[1] + ')</option>'; }).join('') + '</select></label>' +
      '<input class="input" id="ph" data-m="user.phone" inputmode="tel" value="' + esc(S.user.phone) + '"' + (ac ? ' autocomplete="tel-national"' : '') + ' placeholder="' + (cc === '57' ? '310 123 4567' : 'Número') + '"></div>';
  }
  // Celular de otro país: se guarda con el código del país (ej. 31612345678). Colombia sigue con 10 números, como siempre.
  var PAISES = [['🇨🇴', '57', 'Colombia'], ['🇻🇪', '58', 'Venezuela'], ['🇪🇨', '593', 'Ecuador'], ['🇵🇪', '51', 'Perú'], ['🇵🇦', '507', 'Panamá'], ['🇲🇽', '52', 'México'], ['🇺🇸', '1', 'EE. UU. / Canadá'],
    ['🇧🇷', '55', 'Brasil'], ['🇦🇷', '54', 'Argentina'], ['🇨🇱', '56', 'Chile'], ['🇪🇸', '34', 'España'], ['🇳🇱', '31', 'Países Bajos'], ['🇧🇪', '32', 'Bélgica'], ['🇩🇪', '49', 'Alemania'],
    ['🇫🇷', '33', 'Francia'], ['🇮🇹', '39', 'Italia'], ['🇬🇧', '44', 'Reino Unido'], ['🇨🇭', '41', 'Suiza']];
  function ccFlag(cc) { for (var i = 0; i < PAISES.length; i++) if (PAISES[i][1] === cc) return PAISES[i][0]; return '🌐'; }
  // Devuelve el número para guardar, o '' si no es válido.
  function fullPhone(raw, cc) {
    var d = String(raw || '').replace(/\D/g, ''); cc = cc || '57';
    if (cc === '57') { if (d.length === 12 && d.indexOf('57') === 0) d = d.slice(2); return d.length === 10 ? d : ''; }
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf(cc) === 0 && d.length > cc.length + 7) d = d.slice(cc.length);
    d = d.replace(/^0+/, '');
    return d.length >= 6 && d.length + cc.length <= 15 ? cc + d : '';
  }
  function cuentaNote() {
    if (!needLogin()) return '';
    return '<div class="note green mt8 row" style="gap:8px;align-items:flex-start">' + ic('lock', 16) + '<span>La primera vez te mandamos un <b>código por WhatsApp</b> para confirmar tu celular. Así tus sellos quedan guardados en tu número.</span></div>';
  }
  function scrConfirmar() {
    var lines = cartLines(), shop = cartShop();
    if (!lines.length && !wishHas()) {
      return '<div class="screen">' + topbar('Tu carrito', '/inicio') + '<div class="empty"><div class="ic">' + ic('bag', 28) + '</div><div class="b" style="color:var(--text)">Tu carrito está vacío</div><div class="small mt4">Elige un restaurante y agrega algo rico.</div><a class="btn btn-primary mt16" href="#/inicio">Ver restaurantes</a></div></div>';
    }
    var r = R(S.cart.restId), sub = cartSubtotal(), fee = cartFee(), disc = cartDiscount(), total = sub + fee - disc, co = S.co, rw = reward();
    var short = shop ? 0 : r.min - sub;
    if (co.cash !== 'exact' && co.cash !== 'bills') co.cash = 'exact';
    var cashVal = co.cash === 'bills' && billsSum() ? billsSum() : total;
    var far = S.cart.mode === 'dom' && tooFar(r, co.geo);
    var h = '<div class="screen has-cta">' + topbar('Confirmar pedido', '/r/' + r.id, r.name);
    var ag = ui.again && ui.again.rest === r.id && !ui.again.shop ? ui.again : null;
    if (ag) h += '<div class="note green row mb12" style="gap:10px;align-items:flex-start">' + ic('refresh', 18, { sw: 2.4 }) + '<span><b>Repetimos tu pedido.</b> Con la misma dirección y forma de pago. Revisa y toca el botón naranja.' +
      (ag.gone && ag.gone.length ? '<br><b>Ya no está en el menú:</b> ' + esc(ag.gone.join(', ')) + '.' : '') + (ag.changed ? '<br>Algunos precios cambiaron desde la última vez.' : '') + '</span></div>';
    if (S.cart.mode === 'dom') {
      h += '<div class="card"><div class="row b" style="gap:8px"><span class="orange">' + ic('pin', 18) + '</span>¿Dónde te lo llevamos?</div>' +
        '<textarea class="input mt12" id="addr" data-m="user.address" rows="2" placeholder="Barrio, calle y cómo llegar (ej.: dos casas después de la iglesia, puerta azul)">' + esc(S.user.address) + '</textarea>' +
        '<button class="dashed-btn mt8' + (co.geo ? ' done' : '') + (ONLINE && !co.geo ? ' need' : '') + '" data-a="geo">' + ic(co.geo ? 'check' : 'map', 18) + (co.geo ? 'Casa marcada en el mapa · cambiar' : ONLINE ? 'Marca tu casa en el mapa' : 'Poner pin en el mapa (opcional)') + '</button>' +
        (far ? '<div class="note amber mt8">Estás a ' + kmTxt(km(r, co.geo)) + ' y ' + esc(r.short) + ' entrega hasta ' + kmTxt(r.radius || 3) + '. Puedes elegir <b>Recoger</b>.</div>' : '') +
        '<div class="row mt12" style="gap:10px"><div class="grow"><label class="label" for="nm">Tu nombre</label><input class="input" id="nm" data-m="user.name" value="' + esc(S.user.name) + '" autocomplete="name"></div>' +
        '<div class="grow">' + phoneField(true) + '</div></div>' + cuentaNote() +
        '<label class="label mt12" for="note">' + (shop ? 'Nota para la tienda' : 'Nota para la cocina') + '</label><input class="input" id="note" data-m="co.note" value="' + esc(co.note) + '" placeholder="' + (shop ? 'Ej.: si no hay, me llaman' : 'Ej.: carne término medio, sin ají') + '"></div>';
    } else {
      h += '<div class="card"><div class="row b" style="gap:8px"><span class="orange">' + ic('store', 18) + '</span>Recoges en ' + (shop ? 'la tienda' : 'el restaurante') + '</div><div class="small muted mt4">' + r.address + ' · listo en ' + r.pickup + '</div>' +
        '<div class="row mt12" style="gap:10px"><div class="grow"><label class="label" for="nm">Tu nombre</label><input class="input" id="nm" data-m="user.name" value="' + esc(S.user.name) + '"></div>' +
        '<div class="grow">' + phoneField(false) + '</div></div>' + cuentaNote() +
        '<label class="label mt12" for="note">' + (shop ? 'Nota para la tienda' : 'Nota para la cocina') + '</label><input class="input" id="note" data-m="co.note" value="' + esc(co.note) + '" placeholder="' + (shop ? 'Ej.: paso a las 5 p. m.' : 'Ej.: sin cebolla') + '"></div>';
    }
    h += whenCard(r);
    h += '<div class="card mt12"><div class="t-h3" style="margin-bottom:12px">¿Cómo pagas?</div>' +
      [['ef', 'Efectivo', 'Pagas al recibir'], ['nequi', 'Nequi', 'Transfieres y nos avisas aquí'], ['davi', 'Daviplata', 'Transfieres y nos avisas aquí']].map(function (p) {
        var on = co.pay === p[0];
        var subt = p[0] === 'ef' && on ? (co.cash === 'bills' && billsSum() ? 'Pagas con ' + billsTxt(co.bills) + (!shop && cashVal > total ? ' · vueltas ' + fmt(cashVal - total) : '') : 'Pago exacto') : p[2];
        return '<button class="radio-row' + (on ? ' on' : '') + '" data-a="pay" data-v="' + p[0] + '"><span class="ring"></span><span class="grow"><span class="b" style="display:block">' + p[1] + '</span><span class="small muted">' + subt + '</span></span></button>';
      }).join('');
    if (co.pay === 'ef') {
      h += cashBox(total, shop);
    } else {
      h += '<div class="note grey mt12">' + (shop ? 'Cuando la tienda confirme el precio' : 'Después de hacer el pedido') + ' te mostramos el número de ' + (co.pay === 'nequi' ? 'Nequi' : 'Daviplata') + ' ' + (shop ? 'de la tienda' : 'del restaurante') + '.</div>';
    }
    if (waOn()) {
      h += '</div><div class="card mt12"><button class="radio-row check' + (S.user.waOk ? ' on' : '') + '" data-a="waOk" style="margin:0"><span class="ring">' + (S.user.waOk ? ic('check', 14, { sw: 3 }) : '') + '</span><span class="grow"><span class="b" style="display:block">Avísame por WhatsApp</span><span class="small muted">Te escribe Pido y Ido cuando acepten tu pedido y cuando salga.</span></span></button>';
    }
    if (shop) {
      h += '</div><div class="card mt12"><div class="row between"><span class="t-h3">Tu pedido</span><a class="link small" href="#/r/' + r.id + '">Cambiar</a></div>' +
        (String(S.cart.wish || '').trim() ? '<div class="wish-txt mt8">' + esc(S.cart.wish.trim()) + '</div>' : '') +
        (S.cart.wishImg ? '<div class="small green b mt8 row" style="gap:6px">' + ic('check', 14, { sw: 3 }) + 'Foto adjunta</div>' : '') +
        '<div class="divider dashed"></div><div class="row between small" style="padding:3px 0"><span>Productos</span><span class="b">La tienda confirma el precio</span></div>' +
        '<div class="row between small" style="padding:3px 0"><span class="' + (fee ? '' : 'green b') + '">' + (S.cart.mode === 'dom' ? 'Domicilio' : 'Recoges tú') + '</span><span class="' + (fee ? '' : 'green b') + '">' + (fee ? fmt(fee) : 'Gratis') + '</span></div>' +
        '<div class="note green mt12">Te avisamos aquí el precio total. Si no estás de acuerdo, puedes cancelar antes de que salga.</div>' +
        '<button class="btn btn-ghost btn-block mt8" data-a="clearCart">Borrar mi pedido</button>' + orderLegal();
      return h + '</div><div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="placeOrder"' + (ctaOff(r) || ui.busy || far ? ' disabled' : '') + '>' + ctaTxt(r, 'Enviar pedido a ' + esc(r.short)) + '</button></div>';
    }
    // Resumen editable: cambiar cantidades o quitar platos sin volver al menú.
    h += '</div><div class="card mt12"><div class="row between" style="margin-bottom:6px"><span class="t-h3">Tu pedido</span><a class="link small b" href="#/r/' + r.id + '">' + ic('plus', 14) + ' Agregar más</a></div>' + lines.map(function (l) {
      return '<div class="sum-line"><div class="grow"><div class="b" style="font-size:14px">' + esc(l.name) + '</div><div class="xs muted">' + fmt(l.price) + ' c/u</div></div>' +
        '<div class="mini-qty"><button data-a="coDec" data-d="' + esc(l.id) + '" aria-label="' + (l.qty > 1 ? 'Uno menos' : 'Quitar ' + esc(l.name)) + '">' + ic(l.qty > 1 ? 'minus' : 'x', 15) + '</button><span>' + l.qty + '</span><button data-a="coAdd" data-d="' + esc(l.id) + '" aria-label="Uno más">' + ic('plus', 15) + '</button></div>' +
        '<div class="b" style="min-width:74px;text-align:right;font-size:14px">' + fmt(l.qty * l.price) + '</div></div>';
    }).join('') + '<div class="divider dashed"></div><div class="row between small" style="padding:3px 0"><span>Productos</span><span>' + fmt(sub) + '</span></div>' +
      '<div class="row between small" style="padding:3px 0"><span class="' + (fee ? '' : 'green b') + '">' + (S.cart.mode === 'dom' ? 'Domicilio' : 'Recoges tú') + '</span><span class="' + (fee ? '' : 'green b') + '">' + (fee ? fmt(fee) : 'Gratis') + '</span></div>' +
      (disc ? '<div class="row between small green b" style="padding:3px 0"><span class="row" style="gap:6px">' + ic('gift', 15) + 'Premio 5º pedido</span><span>−' + fmt(disc) + '</span></div>' : '') +
      '<div class="divider dashed"></div><div class="row between"><span class="t-h3">Total</span><span class="num" style="font-size:18px">' + fmt(total) + '</span></div></div>' +
      (!disc && rw && rw.ready && sub < rw.min ? '<div class="note green mt12">Tienes un premio de ' + fmt(rw.amount) + '. Se usa en pedidos desde ' + fmt(rw.min) + '.</div>' : '') +
      (short > 0 ? '<div class="note amber mt12">El pedido mínimo es ' + fmt(r.min) + '. Te faltan <b>' + fmt(short) + '</b>. <a class="b" href="#/r/' + r.id + '" style="text-decoration:underline">Agregar más</a></div>' : '') +
      '<button class="btn btn-ghost btn-block mt8" data-a="clearCart">Vaciar carrito</button>' + orderLegal();
    h += '</div><div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="placeOrder"' + (short > 0 || ctaOff(r) || ui.busy || far ? ' disabled' : '') + '>' + ctaTxt(r, 'Hacer pedido · ' + fmt(total)) + '</button></div>';
    return h;
  }
  // Ley 1581: el cliente autoriza el uso de sus datos antes del primer pedido (se pregunta una vez).
  function legalCheck(on, action, html, err) {
    return '<div class="mt12 legal-box' + (err ? ' err' : '') + '"><button class="radio-row check' + (on ? ' on' : '') + '" data-a="' + action + '" style="margin:0;align-items:flex-start"><span class="ring">' + (on ? ic('check', 14, { sw: 3 }) : '') + '</span><span class="grow small" style="text-align:left">' + html + '</span></button></div>';
  }
  function orderLegal() {
    if (S.legalOk) return '';
    return legalCheck(false, 'legalOk', 'Autorizo a Pido y Ido y al negocio a usar mi nombre, celular y dirección para entregar este pedido. <a class="link" href="#/legal/privacidad">Política de datos</a> · <a class="link" href="#/legal/terminos">Términos</a>', ui.legalErr);
  }
  function statusLine(o) {
    var r = R(o.restId);
    if (o.status === 'recibido') return 'Esperando que ' + r.short + ' acepte';
    if (o.status === 'preparando') return 'Lo están preparando';
    if (o.status === 'preparando' && o.mode === 'dom' && riderOf(o) && o.readyAt) return 'Lo están preparando · ' + callName(riderOf(o).name) + ' lo recoge ' + aLasCo(o.readyAt);
    if (o.status === 'listo') return o.mode === 'rec' ? 'Listo para recoger' : riderOf(o) ? 'Listo, ' + callName(riderOf(o).name) + ' ya viene por él' : 'Listo, buscando quién lo lleva';
    if (o.status === 'sin_respuesta') return 'No respondieron a tiempo';
    if (o.status === 'no_entregado') return 'Cerrado sin entregar';
    if (o.status === 'en_camino') return 'Va en camino';
    if (o.status === 'entregado') return 'Entregado ' + ago(o.deliveredAt);
    if (o.status === 'rechazado') return 'No pudieron aceptarlo';
    if (unpriced(o)) return 'Esperando que ' + r.short + ' confirme el precio';
    return STATUS_TXT[o.status];
  }
  function etaInfo(o) {
    var sf = o.scheduledFor;
    if (sf && o.status === 'recibido') return [horaCo(sf), capi(diaCo(sf)) + ' · ' + (o.wish ? 'esperando que la tienda confirme el precio' : 'esperando que ' + R(o.restId).short + ' acepte')];
    if (sf && o.status === 'preparando' && sf - now() > 45 * 60000) return [horaCo(sf), capi(diaCo(sf)) + ' · ' + R(o.restId).short + ' ya lo aceptó'];
    if (sf && o.status === 'preparando') { var lf = Math.max(5, Math.round((sf - now()) / 60000)); return [lf + ' min', o.mode === 'rec' ? 'Para que esté listo (' + horaCo(sf) + ')' : 'Aprox. para que llegue (' + horaCo(sf) + ')']; }
    if (o.status === 'recibido') return ['Esperando', o.wish ? 'Que la tienda confirme el precio' : 'Que el restaurante acepte tu pedido'];
    if (o.status === 'preparando') { var left = Math.max(5, Math.round((o.etaMin || 30) - (now() - o.acceptedAt) / 60000)); return [left + ' min', o.mode === 'rec' ? 'Para que esté listo' : 'Aprox. para que llegue']; }
    if (o.status === 'listo') return o.mode === 'rec' ? ['¡Listo!', 'Ya puedes ir a recogerlo'] : ['10–15 min', 'Ya está listo, sale en un momento'];
    if (o.status === 'en_camino') { var m = Math.max(2, 12 - Math.round((now() - (o.sentAt || now())) / 60000)); return [Math.max(1, m - 4) + '–' + m + ' min', 'Tu pedido va en camino']; }
    if (o.status === 'entregado') return ['Entregado', 'A las ' + hora(o.deliveredAt)];
    return ['—', statusLine(o)];
  }
  // ---------- "¿Algo salió mal?" (016-reclamo.sql): hasta 24 h después de la entrega, una vez por pedido ----------
  var ISSUES = ['Faltó algo', 'Llegó frío o en mal estado', 'No era lo que pedí', 'Me cobraron mal', 'No me llegó', 'Otro problema'];
  function issueOpen(o) { return o.status === 'entregado' && !o.issue && now() - (o.deliveredAt || o.createdAt || 0) < 24 * 3600000; }
  function issueCard(o, r) {
    if (o.issue) return '<div class="card mt12' + (o.issueDoneAt ? '' : ' issue-card') + '"><div class="b">' + (o.issueDoneAt ? ic('check', 16, { sw: 3 }) + ' ' + esc(r.short) + ' marcó tu reclamo como resuelto' : 'Le avisamos a ' + esc(r.short)) + '</div>' +
      '<div class="small muted mt4">«' + esc(o.issue) + (o.issueNote ? ': ' + esc(o.issueNote) : '') + '»' + (o.issueDoneAt ? '' : ' · Te van a escribir por WhatsApp.') + '</div></div>';
    if (!issueOpen(o)) return '';
    return '<button class="btn btn-ghost btn-block mt8" data-a="issueAsk" data-id="' + o.id + '">' + ic('alert', 16) + ' ¿Algo salió mal?</button>';
  }
  function payDigits(ct) { var d = String(ct.nequi || '').replace(/\D/g, ''); return d.length === 12 && d.indexOf('57') === 0 ? d.slice(2) : d; }
  function payBox(o, r, ct, payApp) {
    return '<div class="pay-box mt12"><div class="row between"><span class="small muted">Valor</span><span class="num" style="font-size:22px">' + fmt(o.total) + '</span></div>' +
      '<div class="row between mt8"><span class="small muted">' + payApp + ' de ' + esc(r.short) + '</span><button class="pay-copy" data-a="copyPay" data-v="' + esc(payDigits(ct)) + '">' + esc(ct.nequi) + ' ' + ic('copy', 14) + '</button></div></div>';
  }
  // Colores del estado: rojo (esperando) → naranja (preparando) → amarillo (en camino / listo) → verde (entregado).
  function stageOf(o) { return { recibido: 'st-red', preparando: 'st-orange', listo: 'st-yellow', en_camino: 'st-yellow', entregado: 'st-green' }[o.status] || 'st-grey'; }
  function scrPedido(id) {
    var o = order(id);
    if (!o) return '<div class="screen">' + topbar('Pedido', '/pedidos') + '<div class="empty">No encontramos este pedido.</div></div>';
    var r = R(o.restId), e = etaInfo(o);
    var steps = o.mode === 'rec' ? ['Recibido', 'Preparando', 'Listo', 'Entregado'] : ['Recibido', 'Preparando', 'En camino', 'Entregado'];
    var idx = { recibido: 0, preparando: 1, listo: o.mode === 'rec' ? 2 : 1, en_camino: 2, entregado: 3 }[o.status];
    var h = '<div class="screen flush has-tabs"><div class="status-head ' + stageOf(o) + '"><div class="row between"><div class="small" style="opacity:.85">Pedido #' + o.id + ' · ' + r.name + '</div><a href="#/pedidos" class="small b" style="opacity:.9">Mis pedidos</a></div>';
    if (o.status === 'rechazado' || o.status === 'sin_respuesta' || o.status === 'no_entregado') {
      var ttl = o.status === 'rechazado' ? 'No pudieron aceptar tu pedido' : o.status === 'sin_respuesta' ? r.short + ' no respondió a tiempo' : 'Pedido cerrado sin entregar';
      var why = o.status === 'rechazado' ? esc(o.rejectReason || 'El restaurante está muy lleno ahora.') + ' No se cobró nada.'
        : o.status === 'sin_respuesta' ? 'Nadie aceptó tu pedido en ' + NO_RESP_MIN + ' minutos, así que lo cerramos. No se cobró nada.'
        : esc(r.short) + ' cerró el pedido: ' + esc(o.rejectReason || 'No se entregó.') + (o.pay !== 'ef' && o.paidClaimAt ? ' Si ya transferiste, escríbeles para que te devuelvan la plata.' : ' Si crees que es un error, habla con ' + esc(r.short) + '.');
      h += '<h1 class="mt12" style="font-size:28px">' + esc(ttl) + '</h1><div class="small mt8" style="opacity:.85">' + why + '</div></div>' +
        '<div class="pad" style="margin-top:-40px"><div class="card raised"><a class="btn btn-primary btn-block" href="#/inicio">' + (isShop(r) ? 'Ver otras tiendas' : 'Pedir en otro restaurante') + '</a></div></div></div>' + tabs('cliente', 'pedidos');
      return h;
    }
    var progHead = o.scheduledFor && (o.status === 'recibido' || (o.status === 'preparando' && o.scheduledFor - now() > 45 * 60000));
    h += '<div class="small mt12" style="opacity:.85">' + (progHead ? (o.mode === 'rec' ? 'Programado para recoger' : 'Programado para') : o.status === 'en_camino' || o.status === 'preparando' ? 'Llega en' : '') + '</div><div class="eta">' + e[0] + '</div><div style="opacity:.9">' + e[1] + '</div></div>';
    var priced = o.wish && ['preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0;
    // Nequi / Daviplata: un paso propio para el pago, aparte del estado del pedido (pay_ok de 015-cierre.sql).
    var cells = steps.map(function (s, i) {
      var cls = i < idx || o.status === 'entregado' ? 'done' : i === idx ? 'active' : '';
      return { t: s, cls: cls, on: i === idx, st: ['st-red', 'st-orange', 'st-yellow', 'st-green'][i] };
    });
    if (o.pay !== 'ef' && !unpriced(o)) {
      var pc = o.payOk === true || (o.status === 'entregado' && o.payOk !== false) ? 'done' : o.payOk === false ? 'bad' : o.status === 'recibido' ? '' : 'active';
      // Primero se paga y después se prepara: el pago va justo después de Recibido.
      cells.splice(1, 0, { t: pc === 'done' ? 'Pagado' : pc === 'bad' ? 'Pago no llegó' : o.paidClaimAt ? 'Revisando pago' : 'Pagar', cls: pc, on: pc === 'active' || pc === 'bad', pay: true, st: 'st-orange' });
    }
    h += '<div class="pad" style="margin-top:-44px"><div class="card raised"><div class="progress" style="grid-template-columns:repeat(' + cells.length + ',1fr)">' + cells.map(function (c) {
      return '<div class="' + (c.st || '') + '"><div class="bar ' + c.cls + (c.pay ? ' pay' : '') + '"><i style="width:' + (c.cls === 'done' || c.cls === 'bad' ? '100%' : c.cls === 'active' ? '50%' : '0') + '"></i></div><div class="lbl' + (c.on ? ' on' : '') + (c.cls === 'bad' ? ' bad' : '') + (c.pay && c.cls === 'done' ? ' paid' : '') + '">' + c.t + '</div></div>';
    }).join('') + '</div>';
    var rd = riderOf(o);
    if (o.status === 'en_camino' && rd) {
      var c = avColor(rd.id);
      h += '<div class="divider"></div><div class="row"><div class="avatar" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(rd.name) + '</div><div class="grow"><div class="b">' + esc(rd.name) + '</div><div class="small muted">' + (o.pickedAt ? 'Recogió tu pedido a las ' + hora(o.pickedAt) : 'Domiciliario del restaurante · ' + esc((rd.vehicle || 'Moto').toLowerCase())) + '</div></div>' +
        '<a class="icon-btn green" href="' + waLink(rd.phone, 'Hola ' + first(rd.name) + ', soy ' + S.user.name + ' (pedido #' + o.id + ').') + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ic('msg', 20) + '</a><a class="icon-btn green" href="tel:' + rd.phone + '" aria-label="Llamar">' + ic('phone', 20) + '</a></div>';
    } else if (o.status === 'en_camino' && o.riderId === 'yo') {
      h += '<div class="divider"></div><div class="row"><div class="avatar">' + ic('store', 22) + '</div><div class="grow"><div class="b">Lo lleva el restaurante</div><div class="small muted">' + r.name + '</div></div>' + (contactFor(o).phone ? '<a class="icon-btn green" href="tel:' + contactFor(o).phone + '" aria-label="Llamar">' + ic('phone', 20) + '</a>' : '') + '</div>';
    }
    h += '</div>';
    if (o.status !== 'entregado') {
      h += '<div class="pin-box mt12"><div class="b" style="color:var(--soft-t)">' + (o.mode === 'rec' ? 'Dale este código al recoger' : 'Dale este código a ' + (rd ? esc(callName(rd.name)) : 'quien te entregue') + ' al recibir') + '</div>' +
        '<div class="pin">' + String(o.pin || '····').split('').map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="small" style="color:var(--soft-t)">Así sabemos que el pedido llegó a la persona correcta.</div></div>';
    }
    if (o.status === 'en_camino' || o.status === 'listo') {
      h += '<div class="card mt12 row" style="gap:12px"><div class="grow"><div class="b">¿Ya te llegó?</div><div class="small muted">Si nadie te pidió el código, confírmalo tú.</div></div><button class="btn btn-green btn-sm" data-a="gotIt" data-id="' + o.id + '">' + ic('check', 16, { sw: 2.6 }) + ' Ya lo recibí</button></div>';
    }
    if (priced) {
      h += '<div class="card mt12" style="box-shadow:inset 0 0 0 2px var(--green)"><div class="row" style="gap:10px"><span class="pi">' + ic('check', 18, { sw: 2.6 }) + '</span><div class="grow"><div class="b">' + esc(r.short) + ' confirmó el precio</div><div class="small muted">Productos ' + fmt(o.subtotal) + (o.fee ? ' + domicilio ' + fmt(o.fee) : '') + '</div></div><div class="num" style="font-size:20px">' + fmt(o.total) + '</div></div>' +
        (o.status === 'preparando' ? '<button class="btn btn-ghost btn-block mt8" data-a="cancelOrder" data-id="' + o.id + '">No estoy de acuerdo · cancelar</button>' : '') + '</div>';
    }
    if (o.pay !== 'ef' && o.status !== 'entregado' && !unpriced(o)) {
      var payApp = o.pay === 'nequi' ? 'Nequi' : 'Daviplata', ct = o.status === 'recibido' ? {} : contactFor(o);
      h += '<div class="card mt12"><div class="b">Paga con ' + payApp + '</div>' +
        (o.status === 'recibido' ? '<div class="small muted mt4">Cuando ' + esc(r.short) + ' acepte tu pedido, aquí te mostramos el número para transferir.</div>'
          : ct.nequi ? payBox(o, r, ct, payApp) +
            (o.payOk === true ? '<div class="note green mt12 row" style="gap:8px">' + ic('check', 16, { sw: 3 }) + '<span>' + esc(r.short) + ' confirmó que le llegó tu pago.</span></div>'
              : o.payOk === false ? '<div class="note amber mt12">' + esc(r.short) + ' todavía no ve tu transferencia. Revisa que salió bien' + (o.paidClaimAt ? '' : ' y toca <b>Ya transferí</b>') + '.' + (o.paidClaimAt ? '' : '<button class="btn btn-green btn-sm btn-block mt8" data-a="markPaid" data-id="' + o.id + '">' + ic('check', 18) + ' Ya transferí</button>') + '</div>'
              : o.paidClaimAt ? '<div class="note green mt12 row" style="gap:8px">' + ic('check', 16, { sw: 3 }) + '<span>Le avisamos a ' + esc(r.short) + ' que ya pagaste. Lo revisan en su ' + payApp + '.</span></div>'
              : '<button class="btn btn-pay btn-block mt12" data-a="payApp" data-id="' + o.id + '">' + ic('wallet', 18) + ' Pagar con ' + payApp + '</button>' +
                '<button class="btn btn-green btn-block mt8" data-a="markPaid" data-id="' + o.id + '">' + ic('check', 18) + ' Ya transferí</button>' +
                '<div class="xs muted mt8 center">Copiamos el número, abrimos ' + payApp + ' y al volver aquí te preguntamos si ya pagaste.</div>')
          : '<div class="small muted mt4">' + (ct.loading ? 'Cargando el número…' : 'Paga al recibir o pregúntale al domiciliario.') + '</div>') + '</div>';
    }
    h += '<div class="card mt12 small">' + (o.discount ? '<div class="row between green b" style="padding:3px 0"><span>Premio 5º pedido (ya descontado)</span><span>−' + fmt(o.discount) + '</span></div>' : '') + (unpriced(o) ? '<div class="row between" style="padding:3px 0"><span class="muted">Total</span><span class="b">Por confirmar</span></div>' : o.pay === 'ef' ? '<div class="row between" style="padding:3px 0"><span class="muted">Pagas en efectivo</span><span class="b">' + fmt(o.total) + '</span></div>' +
      (o.cashGiven > o.total ? '<div class="row between" style="padding:3px 0"><span class="muted">Ten listo</span><span class="b" style="text-align:right">' + (o.cashBills ? esc(o.cashBills) : fmt(o.cashGiven)) + ' · vueltas ' + fmt(o.cashGiven - o.total) + '</span></div>' : '') : '<div class="row between" style="padding:3px 0"><span class="muted">Total</span><span class="b">' + fmt(o.total) + '</span></div>') +
      '<div class="row between" style="padding:3px 0"><span class="muted">' + (o.mode === 'rec' ? 'Recoges en' : 'Entrega') + '</span><span class="b" style="text-align:right;max-width:65%">' + esc(o.mode === 'rec' ? r.address : o.customer.address) + '</span></div>' +
      '<div class="row between" style="padding:3px 0"><span class="muted">Pediste</span><span style="text-align:right;max-width:65%' + (o.wish ? ';white-space:pre-line' : '') + '">' + esc(o.wish ? (o.wish === '(Ver la foto)' ? 'Lista en foto' : o.wish) : itemsTxt(o)) + '</span></div>' +
      (o.wishImg ? '<div class="row" style="justify-content:flex-end;padding-top:6px">' + wishPic(o, false) + '</div>' : '') + '</div>';
    if (o.status === 'entregado') {
      h += o.rating ? '<div class="card mt12 center"><div class="small muted">Tu calificación</div><div style="color:var(--orange);font-size:24px;letter-spacing:2px">' + '★★★★★'.slice(0, o.rating) + '<span style="color:#E9E3DB">' + '★★★★★'.slice(o.rating) + '</span></div></div>'
        : '<a class="btn btn-primary btn-block mt12" href="#/calificar/' + o.id + '">Calificar pedido</a>';
      h += '<button class="btn btn-outline btn-block mt12" data-a="reorder" data-id="' + o.id + '">' + ic('refresh', 18, { sw: 2.4 }) + ' Pedir lo mismo otra vez</button>' + issueCard(o, r) + stampCard('mt12');
    }
    // demo helper
    if (['recibido', 'preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0) {
      var next = o.status === 'en_camino' && o.riderId && o.riderId !== 'yo'
        ? '<a class="btn btn-outline btn-block mt8" href="#/wa/' + o.id + '">Abrir el WhatsApp del domiciliario</a>'
        : '<a class="btn btn-outline btn-block mt8" href="#/rest?r=' + o.restId + '">Abrir el panel del restaurante</a>';
      if (!ONLINE) h += '<div class="demo-bar mt16"><b>Modo demo</b>En la vida real el restaurante y el domiciliario hacen el siguiente paso desde su propio celular. Aquí lo puedes hacer tú:' + next + '</div>';
      else if (o.status === 'recibido') h += '<div class="note grey mt16 center">Le avisamos a ' + esc(r.short) + '.' + (o.wish ? ' Aquí ves el precio cuando lo confirme.' : '') + ' Si no responde ' + (o.scheduledFor ? aLasCo(noRespAt(o)).replace(/^a la/, 'antes de la') : 'en ' + NO_RESP_MIN + ' minutos') + ', se cancela solo y no pagas nada.</div>';
      if (o.status === 'recibido') h += '<button class="btn btn-ghost btn-block mt8" data-a="cancelOrder" data-id="' + o.id + '">Cancelar pedido</button>';
    }
    h += '</div></div>' + tabs('cliente', 'pedidos');
    return h;
  }
  function scrCalificar(id) {
    var o = order(id); if (!o) return scrPedidos();
    var r = R(o.restId);
    if (!ui.rate || ui.rate.id !== id) ui.rate = { id: id, stars: 0, tags: {} };
    var d = r.dishes.filter(function (x) { return o.items[0] && x.id === o.items[0].id; })[0];
    var shopR = isShop(r), tags = shopR ? ['Todo completo', 'Rápido', 'Buen precio', 'Buena atención'] : ['Llegó caliente', 'Buena porción', 'Rápido', 'Bien empacado'];
    return '<div class="screen has-cta center"><div class="big-check">' + ic('check', 44, { sw: 2.6 }) + '</div>' +
      '<h1 class="t-title mt16">' + (shopR ? '¡Listo' : '¡Buen provecho') + ', ' + esc(first(o.customer.name)) + '!</h1><div class="muted mt8">Tu pedido de ' + r.name + ' llegó a las ' + hora(o.deliveredAt || now()) + '.</div>' +
      '<div class="card mt20">' + (d ? photo(d.img, '', 'height:150px;border-radius:12px') : cover(r, '', 'height:150px;border-radius:12px')) + '<div class="t-h3 mt16">' + (shopR ? '¿Qué tal te atendieron?' : '¿Qué tal estuvo la comida?') + '</div>' +
      '<div class="stars mt8">' + [1, 2, 3, 4, 5].map(function (n) { return '<button data-a="star" data-v="' + n + '" aria-label="' + n + ' estrellas" style="color:' + (n <= ui.rate.stars ? '#FF6B2C' : '#E9E3DB') + '">' + ic('star', 34, { fill: true, sw: 1 }) + '</button>'; }).join('') + '</div>' +
      '<div class="chips mt16" style="justify-content:center">' + tags.map(function (t) { return '<button class="chip g sm' + (ui.rate.tags[t] ? ' on' : '') + '" data-a="tag" data-v="' + t + '">' + t + '</button>'; }).join('') + '</div></div>' +
      '</div><div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="sendRating" data-id="' + id + '"' + (ui.rate.stars ? '' : ' disabled') + '>Enviar calificación</button><a class="btn btn-ghost btn-block" href="#/inicio" style="height:44px">Ahora no</a></div>';
  }
  function orderRow(o, href) {
    var r = R(o.restId);
    return '<a class="list-row" href="' + href + '">' + cover(r, 'thumb') + '<div class="grow"><div class="row between"><span class="b">#' + o.id + ' · ' + r.short + '</span>' + statusBadge(o) + '</div><div class="small muted ellipsis mt4">' + esc(itemsTxt(o)) + ' · ' + fmt(o.total) + '</div>' + (progTag(o) ? '<div class="mt4">' + progTag(o) + '</div>' : '<div class="xs muted">' + ago(o.createdAt) + '</div>') + '</div></a>';
  }
  function scrPedidos() {
    var mine = S.orders.filter(function (o) { return o.mine; });
    var act = mine.filter(function (o) { return ['recibido', 'preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0; });
    var past = mine.filter(function (o) { return act.indexOf(o) < 0; });
    return '<div class="screen has-tabs">' + topbar('Mis pedidos') +
      (act.length ? '<div class="t-h3">En curso</div><div class="card mt8" style="padding:4px 14px">' + act.map(function (o) { return orderRow(o, '#/pedido/' + o.id); }).join('') + '</div>' : '') +
      '<div class="t-h3 mt20">Anteriores</div>' + (past.length ? '<div class="card mt8" style="padding:4px 14px">' + past.map(function (o) { return o.status === 'entregado' && R(o.restId).id ? '<div class="past-row">' + orderRow(o, '#/pedido/' + o.id) + '<button class="btn btn-soft btn-xs" data-a="reorder" data-id="' + o.id + '">' + ic('refresh', 15, { sw: 2.4 }) + 'Repetir</button></div>' : orderRow(o, '#/pedido/' + o.id); }).join('') + '</div>' : '<div class="empty">Aún no tienes pedidos anteriores.</div>') +
      '</div>' + tabs('cliente', 'pedidos');
  }
  function scrPerfil() {
    var c = avColor('luz');
    return '<div class="screen has-tabs">' + topbar('Perfil') +
      '<div class="card row"><div class="avatar" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(S.user.name) + '</div><div class="grow"><div class="t-h3">' + esc(S.user.name) + '</div><div class="small muted">' + (S.user.phone ? phoneFmt(S.user.phone) + ' · ' : '') + 'Villanueva</div></div></div>' +
      cuentaCard() +
      '<div class="card mt12"><div class="field"><label class="label" for="pn">Nombre</label><input class="input" id="pn" data-m="user.name" value="' + esc(S.user.name) + '"></div>' +
      (loginOn() && S.custPhone ? '' : '<div class="field"><label class="label" for="pp">Celular / WhatsApp</label><input class="input" id="pp" data-m="user.phone" inputmode="tel" value="' + esc(S.user.phone) + '"></div>') +
      '<div class="field"><label class="label" for="pa">Dirección</label><textarea class="input" id="pa" data-m="user.address" rows="2">' + esc(S.user.address) + '</textarea></div>' +
      '<button class="btn btn-green btn-sm btn-block mt12" data-a="saveProfile">Guardar</button></div>' +
      '<div class="card mt12" style="padding:4px 14px">' +
      '<a class="menu-row" href="#/promo"><span class="mi">' + ic('qr', 20) + '</span><span class="grow">Recomienda y gana</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/dom"><span class="mi">' + ic('bike', 20) + '</span><span class="grow">Quiero ser domiciliario</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/rest"><span class="mi">' + ic('store', 20) + '</span><span class="grow">Panel del restaurante</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/"><span class="mi">' + ic('swap', 20) + '</span><span class="grow">Cambiar de rol</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/legal/privacidad"><span class="mi">' + ic('lock', 20) + '</span><span class="grow">Tus datos y privacidad</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/legal/terminos"><span class="mi">' + ic('receipt', 20) + '</span><span class="grow">Términos de uso</span>' + ic('right', 18) + '</a>' +
      (ONLINE ? '' : '<button class="menu-row" data-a="resetAsk"><span class="mi" style="background:#FDE8E6;color:#A1291B">' + ic('refresh', 20) + '</span><span class="grow">Reiniciar datos de demo</span></button>') + '</div>' +
      installCard() + '<div class="xs muted center mt16">Pido y Ido · ' + (ONLINE ? 'Villanueva, Casanare' : 'prototipo de demostración') + '</div></div>' + tabs('cliente', 'perfil');
  }

  // ---------- Restaurant ----------
  function restHeader(r) {
    var open = S.open[r.id];
    return '<div class="row">' + cover(r, 'thumb s44') + '<button class="grow" style="text-align:left" data-a="pickRest"><div class="xs muted">' + (isShop(r) ? 'Panel de tu ' + kindOf(r).t.toLowerCase() : 'Panel del restaurante') + '</div><div class="b row" style="gap:4px"><span class="ellipsis">' + r.name + '</span>' + ic('down', 16) + '</div></button>' +
      '<button class="toggle" data-a="toggleOpen" style="background:' + (open ? 'var(--gtint)' : 'var(--track)') + ';color:' + (open ? 'var(--green)' : 'var(--muted)') + '">' + (open ? 'Abierto' : 'Cerrado') +
      '<span class="tr" style="background:' + (open ? 'var(--green)' : '#C9C1B7') + ';--k:' + (open ? '19px' : '3px') + '"></span></button></div>';
  }
  // Online: "get ready" card until the restaurant has a menu, a photo, a map pin and is open.
  function setupItems(r) {
    var own = r.img && !PHOTOS.some(function (p) { return p[1] === r.img; });
    if (isShop(r)) return [
      { ok: true, t: 'Cuenta creada', s: '' },
      { ok: !!String(r.sub || '').trim(), t: 'Cuenta qué vendes', s: 'Ej.: ' + kindOf(r).sub, href: '#/rest/menu' },
      { ok: hasLoc(r), t: 'Marca tu tienda en el mapa', s: 'Y hasta dónde entregas', href: '#/rest/menu' },
      { ok: !!S.open[r.id], t: 'Abre para recibir pedidos', s: 'Toca Abierto arriba', a: 'toggleOpen' }
    ];
    return [
      { ok: true, t: 'Cuenta creada', s: '' },
      { ok: r.dishes.length >= 3, t: 'Agrega tu menú', s: r.dishes.length ? r.dishes.length + ' de 3 platos o más' : 'Con precio y foto', href: '#/rest/menu' },
      { ok: !!r.img, t: 'Pon una foto de portada', s: own ? '' : 'Mejor una foto real de tu comida', href: '#/rest/menu' },
      { ok: hasLoc(r), t: 'Marca tu local en el mapa', s: 'Y hasta dónde entregas', href: '#/rest/menu' },
      { ok: !!S.open[r.id], t: 'Abre para recibir pedidos', s: 'Toca Abierto arriba', a: 'toggleOpen' }
    ];
  }
  // 018-sin-revision.sql: los negocios salen de una vez; Pido y Ido puede ocultar uno desde #/admin.
  function hiddenCard(r) {
    if (!ONLINE || r.aprobado !== false) return '';
    return '<button class="note amber mt12" data-a="reviewInfo" style="width:100%;text-align:left"><b>Los clientes todavía no ven tu negocio.</b> Pido y Ido lo revisa. Toca aquí para escribirnos.</button>';
  }
  function recoveryCard() {
    if (!ONLINE || S.hasRecovery !== false) return '';
    return '<div class="card mt12 row" style="gap:12px;align-items:flex-start"><span class="pi">' + ic('lock', 18) + '</span><div class="grow"><div class="b">Guarda tu código para recuperar la clave</div>' +
      '<div class="xs muted mt4">Si un día olvidas tu clave, con este código creas una nueva tú mismo.</div>' +
      '<button class="btn btn-green btn-sm mt8" data-a="recoveryNew">Ver mi código</button></div></div>';
  }
  function notifCard() {
    if (!ONLINE || !('Notification' in window) || Notification.permission !== 'default') return '';
    return '<div class="card mt12 row" style="gap:12px;align-items:flex-start"><span class="pi">' + ic('bell', 18) + '</span><div class="grow"><div class="b">Activa los avisos de pedidos</div>' +
      '<div class="xs muted mt4">Así te sale un aviso con sonido aunque estés en otra app. Deja Pido y Ido abierto en el celular o la tablet del negocio.</div>' +
      '<button class="btn btn-green btn-sm mt8" data-a="notifOn">Activar avisos</button></div></div>';
  }
  function setupDone(r) { return setupItems(r).every(function (x) { return x.ok; }); }
  function setupCard(r) {
    var it = setupItems(r), n = it.filter(function (x) { return x.ok; }).length;
    if (n === it.length) return '';
    return '<div class="card setup mt12"><div class="row between"><div><div class="t-h3">Prepara ' + (isShop(r) ? 'tu tienda' : 'tu restaurante') + '</div><div class="small muted mt4">' + n + ' de ' + it.length + ' pasos listos</div></div><span class="ring-pct" style="--p:' + Math.round(n / it.length * 100) + '"><span>' + Math.round(n / it.length * 100) + '%</span></span></div>' +
      '<div class="setup-list mt12">' + it.map(function (x) {
        var inner = '<span class="sc' + (x.ok ? ' ok' : '') + '">' + (x.ok ? ic('check', 14, { sw: 3 }) : '') + '</span><span class="grow"><span class="b' + (x.ok ? ' done' : '') + '">' + x.t + '</span>' + (!x.ok && x.s ? '<span class="xs muted" style="display:block">' + x.s + '</span>' : '') + '</span>' + (x.ok ? '' : ic('right', 18));
        if (x.ok) return '<div class="setup-row">' + inner + '</div>';
        return x.a ? '<button class="setup-row" data-a="' + x.a + '">' + inner + '</button>' : '<a class="setup-row" href="' + x.href + '">' + inner + '</a>';
      }).join('') + '</div></div>';
  }
  function scrRest(query) {
    if (!ONLINE && query && query.r && RESTAURANTS.some(function (x) { return x.id === query.r; })) { S.restId = query.r; save(); }
    var r = R(S.restId);
    var mine = S.orders.filter(function (o) { return o.restId === r.id; });
    var groups = {
      nuevos: mine.filter(function (o) { return o.status === 'recibido'; }),
      preparando: mine.filter(function (o) { return o.status === 'preparando' || o.status === 'listo'; }).sort(function (a, b) { return due(a) - due(b); }),
      camino: mine.filter(function (o) { return o.status === 'en_camino'; }),
      hechos: mine.filter(function (o) { return o.status === 'entregado' || CLOSED_BAD.indexOf(o.status) >= 0; })
    };
    var today = mine.filter(function (o) { return isToday(o.createdAt) && CLOSED_BAD.indexOf(o.status) < 0; });
    var base = ONLINE ? [0, 0] : { llanero: [14, 412000], plaza: [9, 318000], rosa: [11, 276000] }[r.id] || [0, 0];
    var doneT = today.filter(function (o) { return o.deliveredAt && o.createdAt; });
    var avgMin = ONLINE ? (doneT.length ? Math.round(doneT.reduce(function (a, o) { return a + (o.deliveredAt - o.createdAt); }, 0) / doneT.length / 60000) : '—') : 24;
    var h = '<div class="screen has-tabs">' + restHeader(r) +
      '<div class="stats mt16"><div class="stat"><div class="xs muted">Hoy</div><div class="v">' + (base[0] + today.length) + '</div><div class="xs muted">pedidos</div></div>' +
      '<div class="stat"><div class="xs muted">Ventas</div><div class="v">$' + Math.round((base[1] + today.reduce(function (a, o) { return a + o.total; }, 0)) / 1000) + 'k</div><div class="xs muted">COP</div></div>' +
      '<div class="stat"><div class="xs muted">Promedio</div><div class="v">' + avgMin + '</div><div class="xs muted">min</div></div></div>' +
      '<a class="card mt12 row mes-link" href="#/rest/mes">' + '<span class="mes-ic">' + ic('chart', 20) + '</span><div class="grow"><div class="b">Tu mes con Pido y Ido</div><div class="xs muted">Clientes nuevos, ventas y comisión de ' + ymTxt(ymOf(now())) + '</div></div>' + ic('right', 18) + '</a>' +
      hiddenCard(r) + (ONLINE ? setupCard(r) : '') + recoveryCard() + notifCard() +
      (S.open[r.id] && r.horario && !enHorario(r, now()) ? '<div class="note grey mt12"><b style="color:var(--text)">Fuera de tu horario.</b> Los clientes ven: «' + estadoTxt(r) + '». Pueden programar pedidos para cuando abras. <a href="#/rest/menu" class="b orange">Cambiar horario</a></div>' : '') +
      (S.open[r.id] || (ONLINE && !setupDone(r)) ? '' : '<div class="note amber mt12"><b>Estás cerrado.</b> ' + (ONLINE ? 'Cuando quieras recibir pedidos, toca <b>Abierto</b> arriba.' : 'Los clientes ven tu menú, pero no pueden pedir.') + '</div>') +
      '<div class="chips scroll mt16">' + [['nuevos', 'Nuevos'], ['preparando', 'Preparando'], ['camino', 'En camino'], ['hechos', 'Terminados']].map(function (t) {
        var n = t[0] === 'hechos' ? groups.hechos.filter(function (o) { return o.issue && !o.issueDoneAt; }).length : groups[t[0]].length;
        return '<button class="chip' + (ui.rtab === t[0] ? ' on' : '') + '" data-a="rtab" data-v="' + t[0] + '">' + t[1] + (n ? ' <span class="cnt">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div><div class="mt12">';
    var list = groups[ui.rtab];
    if (!list.length) {
      var emptyTxt = { nuevos: 'No hay pedidos nuevos. Cuando llegue uno, aparece aquí' + (waOn() ? ' (y Pido y Ido te avisa por WhatsApp).' : '.'), preparando: 'Nada en preparación.', camino: 'Ningún pedido en camino.', hechos: 'Todavía no hay pedidos terminados.' }[ui.rtab];
      h += '<div class="empty"><div class="ic">' + ic('receipt', 26) + '</div>' + emptyTxt + '</div>';
      if (ui.rtab === 'nuevos' && ONLINE) h += '<div class="note grey center">Deja esta pantalla abierta: suena cuando llega un pedido.</div>';
      if (ui.rtab === 'nuevos' && !ONLINE) h += '<div class="demo-bar"><b>Modo demo</b>Haz un pedido como cliente y vuelve aquí para aceptarlo.<a class="btn btn-outline btn-block mt8" href="#/r/' + r.id + '">Pedir como cliente</a></div>';
    }
    h += list.map(function (o) { return restOrderCard(o); }).join('');
    return h + '</div></div>' + tabs('rest', 'pedidos');
  }
  // ---------- Resumen del mes (lo que Pido y Ido le trajo al negocio) ----------
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var COMISION = 5, OTRA_APP = 25;
  function ymOf(t) { var d = new Date(t - CO_OFF); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); }
  function ymShift(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + String(m + 1).padStart(2, '0'); }
  function ymTxt(ym) { return MESES[+ym.slice(5) - 1]; }
  function ymDays(ym) { return new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5), 0)).getUTCDate(); }
  // Misma cuenta que el servidor (supabase/010-resumen-mes.sql): demo, y respaldo si ese paso aún no está pegado.
  function monthStats(list, ym, pct) {
    var del = list.filter(function (o) { return o.status === 'entregado' && o.createdAt; }).sort(function (a, b) { return a.createdAt - b.createdAt; });
    var who = function (o) { var p = String((o.customer || {}).phone || '').replace(/\D/g, '').slice(-10); return p || 'n:' + (o.customer || {}).name; };
    var firstAt = {}; del.forEach(function (o) { var k = who(o); if (!firstAt[k]) firstAt[k] = ymOf(o.createdAt); });
    var mes = del.filter(function (o) { return ymOf(o.createdAt) === ym; }), prevYm = ymShift(ym, -1), prev = del.filter(function (o) { return ymOf(o.createdAt) === prevYm; });
    var per = {}, top = {}, dias = {};
    mes.forEach(function (o) {
      var k = who(o); per[k] = (per[k] || 0) + 1;
      (o.items || []).forEach(function (i) { top[i.name] = (top[i.name] || 0) + (i.qty || 1); });
      var d = new Date(o.createdAt - CO_OFF).getUTCDate(); dias[d] = (dias[d] || 0) + 1;
    });
    var ks = Object.keys(per), sum = function (a, f) { return a.reduce(function (x, o) { return x + (o[f] || 0); }, 0); };
    return {
      mes: ym, comision_pct: pct == null ? COMISION : pct, pedidos: mes.length, ventas: sum(mes, 'subtotal'), domicilios: sum(mes, 'fee'), premios: sum(mes, 'discount'),
      clientes: ks.length, nuevos: ks.filter(function (k) { return firstAt[k] === ym; }).length,
      pedidos_nuevos: mes.filter(function (o) { return firstAt[who(o)] === ym; }).length,
      repiten: ks.filter(function (k) { return per[k] > 1; }).length, volvieron: ks.filter(function (k) { return firstAt[k] !== ym; }).length,
      top: Object.keys(top).sort(function (a, b) { return top[b] - top[a] || (a < b ? -1 : 1); }).slice(0, 3).map(function (n) { return { name: n, qty: top[n] }; }),
      dias: dias, antes: { pedidos: prev.length, ventas: sum(prev, 'subtotal') }
    };
  }
  // Demo: historia inventada (pero fija) de los últimos meses, para ver cómo se ve el resumen.
  function demoHistory(r) {
    if (ui.demoHist && ui.demoHist[r.id]) return ui.demoHist[r.id];
    var seedN = 0; String(r.id).split('').forEach(function (c) { seedN = (seedN * 31 + c.charCodeAt(0)) % 2147483647; });
    var rnd = function () { seedN = (seedN * 16807) % 2147483647; return (seedN - 1) / 2147483646; };
    var dishes = r.dishes.length ? r.dishes : [{ id: 'x', name: 'Pedido', price: 25000 }], out = [], t0 = now(), pool = 0;
    for (var day = 92; day >= 1; day--) {
      var growth = 1 + (92 - day) / 40, n = Math.round((2 + rnd() * 4) * growth);
      for (var j = 0; j < n; j++) {
        var back = pool && rnd() < Math.min(.62, .2 + pool / 160), c = back ? Math.floor(rnd() * pool) : pool++;
        var items = [], k = 1 + Math.floor(rnd() * 2);
        for (var q = 0; q < k; q++) { var d = dishes[Math.floor(rnd() * dishes.length)]; items.push({ id: d.id, name: d.name, price: d.price, qty: 1 + (rnd() < .25 ? 1 : 0) }); }
        var sub = items.reduce(function (a, i) { return a + i.price * i.qty; }, 0), at = t0 - day * 86400000 + (11 + rnd() * 9) * 3600000;
        if (at > t0) continue;
        out.push({ status: 'entregado', restId: r.id, createdAt: at, subtotal: sub, fee: r.fee || 0, discount: rnd() < .08 ? 2000 : 0, items: items, customer: { phone: '3' + String(100000000 + c * 7919).slice(0, 9) } });
      }
    }
    ui.demoHist = ui.demoHist || {}; ui.demoHist[r.id] = out;
    return out;
  }
  function restMonth(r, ym) {
    if (!ONLINE) return monthStats(demoHistory(r).concat(S.orders.filter(function (o) { return o.restId === r.id; })), ym);
    ui.mes = ui.mes || {};
    var key = r.id + ym, c = ui.mes[key];
    if (c && (c.data || c.err) && now() - c.at < 60000) return c.data || c.err;
    if (!c || !c.loading) {
      ui.mes[key] = { loading: true, at: now(), data: c && c.data };
      CLOUD.restMonth(ym).then(function (d) { ui.mes[key] = { data: d, at: now() }; render(); },
        function () { ui.mes[key] = { data: Object.assign(monthStats(S.orders.filter(function (o) { return o.restId === r.id; }), ym), { parcial: true }), at: now() }; render(); });
    }
    return c && c.data ? c.data : null;
  }
  function pctTxt(p) { return String(+p).replace('.', ',') + '%'; }
  function trendTxt(cur, prev, unit) {
    if (!prev) return '';
    var d = Math.round((cur - prev) / prev * 100);
    return '<span class="trend ' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '%</span> <span class="xs muted">vs. ' + unit + '</span>';
  }
  function scrRestMes(query) {
    var r = R(S.restId), cur = ymOf(now()), ym = query && /^\d{4}-\d{2}$/.test(query.m || '') && query.m <= cur ? query.m : cur;
    var h = '<div class="screen has-tabs">' + topbar('Tu mes con Pido y Ido', '/rest', r.name) +
      '<div class="chips scroll">' + [0, -1, -2].map(function (n) { var m = ymShift(cur, n); return '<a class="chip' + (m === ym ? ' on' : '') + '" href="#/rest/mes?m=' + m + '">' + capi(ymTxt(m)) + (n === 0 ? ' (va)' : '') + '</a>'; }).join('') + '</div>';
    var st = restMonth(r, ym);
    if (!st) return h + '<div class="empty">' + ic('chart', 26) + '<div class="mt8">Sumando tus pedidos…</div></div></div>' + tabs('rest', 'pedidos');
    var pct = +st.comision_pct, com = Math.round(st.ventas * pct / 100), net = Math.max(com - st.premios, 0), queda = st.ventas - com;
    var otra = Math.round(st.ventas * OTRA_APP / 100), ticket = st.pedidos ? Math.round(st.ventas / st.pedidos) : 0, enCurso = ym === cur;
    var mesTxt = ymTxt(ym), antes = ymTxt(ymShift(ym, -1));
    h += '<div class="mes-hero mt16"><div class="xs" style="opacity:.8">' + (enCurso ? 'En ' + mesTxt + ', hasta hoy' : 'En ' + mesTxt) + ' Pido y Ido te trajo</div>' +
      '<div class="row mt8" style="gap:18px;align-items:flex-end"><div><div class="mes-big">' + st.pedidos + '</div><div class="small">pedidos entregados</div></div><div><div class="mes-big">' + fmt(st.ventas) + '</div><div class="small">en ventas</div></div></div>' +
      (st.antes && st.antes.pedidos && !enCurso ? '<div class="mt8 small">' + trendTxt(st.pedidos, st.antes.pedidos, antes).replace('xs muted', 'xs') + '</div>' : '') + '</div>';
    if (!st.pedidos) {
      h += '<div class="empty">' + (enCurso ? 'Todavía no hay pedidos entregados este mes. Aquí vas a ver cuántos clientes nuevos te trae la app.' : 'En ' + mesTxt + ' no hubo pedidos entregados por la app.') + '</div>';
      return h + '</div>' + tabs('rest', 'pedidos');
    }
    h += '<div class="stats mt12"><div class="stat"><div class="xs muted">Clientes nuevos</div><div class="v green">' + st.nuevos + '</div><div class="xs muted">primera vez</div></div>' +
      '<div class="stat"><div class="xs muted">Volvieron</div><div class="v">' + st.volvieron + '</div><div class="xs muted">ya te conocían</div></div>' +
      '<div class="stat"><div class="xs muted">Promedio</div><div class="v">$' + Math.round(ticket / 1000) + 'k</div><div class="xs muted">por pedido</div></div></div>';
    h += '<div class="note green mt12 row" style="gap:10px;align-items:flex-start">' + ic('users', 18) + '<span><b>' + st.nuevos + (st.nuevos === 1 ? ' cliente nuevo</b> te pidió' : ' clientes nuevos</b> te pidieron') + ' por primera vez por la app' + (st.pedidos_nuevos ? ' (' + st.pedidos_nuevos + ' pedidos)' : '') + '.' +
      (st.repiten ? ' <b>' + st.repiten + '</b> ' + (st.repiten === 1 ? 'cliente pidió' : 'clientes pidieron') + ' más de una vez este mes.' : '') + '</span></div>';
    // Pedidos por semana
    var days = ymDays(ym), weeks = [], dias = st.dias || {};
    var hoyD = enCurso ? new Date(now() - CO_OFF).getUTCDate() : 99;
    for (var w = 0; w * 7 < days && w * 7 + 1 <= hoyD; w++) { var n = 0; for (var d = w * 7 + 1; d <= Math.min(days, w * 7 + 7); d++) n += +(dias[d] || dias[String(d)] || 0); weeks.push([w * 7 + 1, Math.min(days, w * 7 + 7), n]); }
    var mx = Math.max.apply(null, weeks.map(function (x) { return x[2]; }).concat([1]));
    h += '<div class="card mt12"><div class="t-h3">Pedidos por semana</div><div class="wk-bars mt12">' + weeks.map(function (x) {
      return '<div class="wk-col"><div class="wk-n">' + x[2] + '</div><div class="wk-bar" style="height:' + Math.max(4, Math.round(x[2] / mx * 90)) + 'px"></div><div class="xs muted">' + x[0] + '–' + x[1] + '</div></div>';
    }).join('') + '</div></div>';
    // La cuenta
    h += '<div class="card mt12"><div class="t-h3">La cuenta del mes</div>' +
      '<div class="row between small mt12"><span>Ventas por la app</span><span class="b">' + fmt(st.ventas) + '</span></div>' +
      '<div class="row between small mt8"><span>Comisión Pido y Ido (' + pctTxt(pct) + ')</span><span>−' + fmt(com) + '</span></div>' +
      '<div class="divider dashed"></div><div class="row between"><span class="t-h3">Te queda</span><span class="num" style="font-size:18px">' + fmt(queda) + '</span></div>' +
      (st.premios ? '<div class="note green mt12 row" style="gap:8px;align-items:flex-start">' + ic('gift', 16) + '<span>Tus clientes recibieron ' + fmt(st.premios) + ' en premios (cada 5º pedido). Ese descuento lo paga Pido y Ido: se resta de la comisión, así que nos pagas ' + fmt(net) + '.</span></div>' : '') +
      '<div class="xs muted mt8">Los domicilios (' + fmt(st.domicilios) + ') no pagan comisión: son todos tuyos.</div></div>';
    h += '<div class="card mt12 compare"><div class="row" style="gap:10px;align-items:flex-start"><span class="orange">' + ic('wallet', 20) + '</span><div class="grow"><div class="b">Con una app grande pagarías ' + fmt(otra) + '</div>' +
      '<div class="small muted mt4">Las apps grandes cobran ' + OTRA_APP + '% o más. Con Pido y Ido ' + (pct ? 'son ' + fmt(com) : 'no pagas nada este mes') + ', o sea <b class="green">' + fmt(otra - com) + ' más para ti</b>.</div></div></div></div>';
    if (st.top && st.top.length) h += '<div class="card mt12"><div class="t-h3">' + (isShop(r) ? 'Lo que más piden' : 'Tus platos más pedidos') + '</div>' + st.top.map(function (t, i) {
      return '<div class="row between small mt8"><span><b class="orange">' + (i + 1) + '.</b> ' + esc(t.name) + '</span><span class="muted">' + t.qty + '×</span></div>'; }).join('') + '</div>';
    h += '<div class="xs muted mt12 center">Solo cuenta pedidos entregados por la app. Un cliente es nuevo si ese mes te pidió por primera vez por Pido y Ido.' + (st.parcial ? ' (Cuenta aproximada con tus últimos 100 pedidos.)' : '') + (ONLINE ? '' : ' En la demo los números son de ejemplo.') + '</div>';
    return h + '</div>' + tabs('rest', 'pedidos');
  }
  function due(o) { return o.scheduledFor || (o.acceptedAt || o.createdAt || 0) + (o.etaMin || 30) * 60000; }
  function restPayNotes(o) {
    return (o.discount ? '<div class="xs green b mt4">' + ic('gift', 12) + ' Premio Pido y Ido: el cliente paga ' + fmt(o.discount) + ' menos. Te lo descontamos de la comisión.</div>' : '') +
      (o.pay === 'ef' || ['preparando', 'listo', 'en_camino', 'entregado'].indexOf(o.status) < 0 ? '' : payCheckBox(o));
  }
  // Nequi / Daviplata: el negocio confirma si la plata llegó (015-cierre.sql).
  function payCheckBox(o) {
    var app = o.pay === 'nequi' ? 'Nequi' : 'Daviplata';
    if (o.payOk === true) return '<div class="xs b mt4" style="color:var(--green)">' + ic('check', 12, { sw: 3 }) + ' Pago por ' + app + ' recibido</div>';
    if (o.payOk === false) return '<div class="xs b mt4" style="color:#A1291B">El pago por ' + app + ' no ha llegado. Si no llega, ciérralo con «No se entregó».</div>' +
      '<button class="btn btn-soft btn-xs mt4" data-a="payOk" data-id="' + o.id + '" data-v="1">' + ic('check', 14, { sw: 2.6 }) + 'Ya llegó</button>';
    return '<div class="pay-check mt8"><div class="xs b">' + (o.paidClaimAt ? 'El cliente dice que ya transfirió ' + fmt(o.total) + '. Revisa tu ' + app + '.' : 'Paga ' + fmt(o.total) + ' por ' + app + '. Revisa tu ' + app + '.') + '</div>' +
      '<div class="row mt8" style="gap:8px"><button class="btn btn-green btn-xs" style="flex:1" data-a="payOk" data-id="' + o.id + '" data-v="1">' + ic('check', 14, { sw: 2.6 }) + 'Pago recibido</button><button class="btn btn-outline btn-xs" style="flex:1" data-a="payOk" data-id="' + o.id + '" data-v="0">No ha llegado</button></div></div>';
  }
  // Cerrar un pedido que no se entregó + aviso de cierre automático.
  function closeBits(o) {
    var at = autoAt(o), left = at - now();
    return (left < 3600000 ? '<div class="xs muted mt8">' + ic('clock', 12, { sw: 2.4 }) + ' Si no lo cierras, ' + aLasCo(at) + ' cuenta como entregado.</div>' : '') +
      '<button class="btn btn-ghost btn-xs mt8" data-a="noEntAsk" data-id="' + o.id + '">No se entregó</button>';
  }
  function restOrderCard(o) {
    var items = o.wish ? '<div class="wish-box">' + (o.wishImg ? wishPic(o, true) : '') + '<div class="grow"><div class="xs muted b" style="text-transform:uppercase;letter-spacing:.4px">Lista del cliente</div><div class="wish-txt mt4">' + esc(o.wish === '(Ver la foto)' ? 'Ver la foto' : o.wish) + '</div></div></div>'
      : o.items.map(function (i) { return '<div class="row between" style="padding:2px 0"><span><b>' + i.qty + '×</b> ' + esc(i.name) + '</span><span>' + fmt(i.qty * i.price) + '</span></div>'; }).join('');
    var cust = '<div class="small mt8"><b>' + esc(o.customer.name) + '</b>' + (o.phoneOk ? ' <span class="xs" style="color:var(--green)" title="Número confirmado por WhatsApp">' + ic('check', 12, { sw: 3 }) + ' número confirmado</span>' : '') + ' · ' + (o.mode === 'rec' ? 'Recoge en el local' : esc(o.customer.address)) + (o.mode === 'dom' && o.geo ? ' · <a class="link" target="_blank" rel="noopener" href="' + mapsLink(o.geo) + '">Ver en el mapa</a>' : '') + '</div><div class="small mt4"><b>' + payTxt(o).split(' · ')[0] + '</b>' + (payTxt(o).indexOf(' · ') > 0 ? ' · ' + payTxt(o).split(' · ').slice(1).join(' · ') : '') + '</div>' + (o.status === 'recibido' ? restPayNotes(o) : '');
    var note = o.note ? '<div class="note grey mt8">Nota: ' + esc(o.note) + '</div>' : '';
    var sf = o.scheduledFor;
    if (o.status === 'recibido') {
      return '<div class="order-card"><div class="oh"><span class="row" style="gap:8px"><span class="pulse"></span>' + (sf ? 'Pedido programado' : 'Pedido nuevo') + ' · ' + ago(o.createdAt) + '</span><span>#' + o.id + '</span></div><div class="ob">' +
        (sf ? '<div class="prog-box">' + ic('clock', 20, { sw: 2.2 }) + '<div class="grow"><div class="b">Para ' + cuandoCo(sf) + '</div><div class="xs">' + (o.mode === 'rec' ? 'El cliente lo recoge a esa hora.' : 'Entrégalo a esa hora, no antes.') + '</div></div></div>' : '') +
        (o.flags ? '<div class="note amber mt8">' + ic('alert', 14) + ' Este cliente tiene ' + (o.flags > 1 ? o.flags + ' pedidos' : '1 pedido') + ' sin pagar o sin recibir en Pido y Ido.' + (o.pay === 'ef' ? ' Puedes llamarlo antes de cocinar.' : '') + '</div>' : '') +
        items + note + '<div class="divider"></div>' + cust +
        (o.wish ? '<div class="label mt12" for="wp' + o.id + '">Valor de los productos</div><div class="input-ic">' + ic('wallet', 18) + '<span class="pre money">$</span><input class="input" id="wp' + o.id + '" inputmode="numeric" autocomplete="off" data-price="' + o.id + '" value="' + esc(ui.choose['p' + o.id] || '') + '" placeholder="Ej.: 23000"></div>' +
          '<div class="xs muted mt4">' + (o.fee && o.mode === 'dom' ? 'Se suma el domicilio de ' + fmt(o.fee) + '. ' : '') + 'El cliente ve el precio en su app y puede cancelar si no está de acuerdo.</div>' : '') +
        (sf ? '' : '<div class="label mt12">' + (o.wish ? 'Tiempo para alistarlo' : 'Tiempo de preparación') + (o.mode === 'dom' ? ' y entrega' : '') + '</div><div class="chips">' + [20, 30, 45].map(function (m) { var on = (ui.choose['eta' + o.id] || 30) === m; return '<button class="chip sm' + (on ? ' on' : '') + '" data-a="etaPick" data-id="' + o.id + '" data-v="' + m + '">' + m + ' min</button>'; }).join('') + '</div>') +
        '<div class="row mt12" style="gap:10px"><button class="btn btn-outline" style="flex:1" data-a="reject" data-id="' + o.id + '">Rechazar</button><button class="btn btn-primary" style="flex:1.6" data-a="accept" data-id="' + o.id + '">' + (o.wish ? 'Aceptar con este precio' : sf ? 'Aceptar para ' + (diaCo(sf) === 'hoy' ? '' : diaCo(sf) + ' ') + horaCo(sf) : 'Aceptar · ' + (ui.choose['eta' + o.id] || 30) + ' min') + '</button></div>' +
        '<div class="xs muted center mt8">Responde ' + aLasCo(noRespAt(o)).replace(/^a la/, 'antes de la') + ' o se cancela solo.</div></div></div>';
    }
    var head = '<div class="row between"><span class="b">#' + o.id + ' · ' + esc(first(o.customer.name)) + '</span>' + statusBadge(o) + '</div>' + (progTag(o) ? '<div class="mt4">' + progTag(o) + '</div>' : '') + '<div class="small muted mt4">' + esc(itemsTxt(o)) + ' · ' + fmt(o.total) + '</div>' + restPayNotes(o);
    if (o.status === 'preparando') {
      var mins = Math.round((now() - o.acceptedAt) / 60000);
      var left = sf ? Math.round((sf - now()) / 60000) : 0;
      return '<div class="order-card' + (sf && left > 45 ? ' later' : '') + '"><div class="ob">' + head + '<div class="xs muted mt4">' + (sf ? (o.mode === 'rec' ? 'Listo para recoger ' : 'Entregar ') + cuandoCo(sf) + (left >= 720 ? '' : left > 0 ? ' · faltan ' + (left >= 60 ? Math.floor(left / 60) + ' h ' + (left % 60) + ' min' : left + ' min') : ' · ¡ya es la hora!') : 'Aceptado ' + ago(o.acceptedAt) + ' · ' + mins + ' de ' + o.etaMin + ' min') + '</div>' + note + riderLine(o) +
        (o.mode === 'dom' && !o.riderId ? '<div class="row mt12" style="gap:8px"><a class="btn btn-outline btn-sm" style="flex:1" href="#/rest/enviar/' + o.id + '">' + ic('bike', 16) + ' Avisar domiciliario</a><button class="btn btn-green btn-sm" style="flex:1" data-a="ready" data-id="' + o.id + '">' + ic('check', 16) + ' Listo</button></div>'
          : '<button class="btn btn-green btn-sm btn-block mt12" data-a="ready" data-id="' + o.id + '">' + ic('check', 18) + ' Listo' + (o.mode === 'dom' ? (riderOf(o) ? ', avisar a ' + esc(callName(riderOf(o).name)) : ', sale ya') : ' para recoger') + '</button>') + closeBits(o) + '</div></div>';
    }
    if (o.status === 'listo') {
      return '<div class="order-card"><div class="ob">' + head + riderLine(o) + (o.mode === 'dom' && riderOf(o)
        ? '<div class="row mt12" style="gap:8px">' + (ONLINE ? '<a class="btn btn-outline btn-sm" style="flex:1" target="_blank" rel="noopener" href="' + waLink(riderOf(o).phone, riderMsg(o)) + '">Reenviar</a>' : '') + '<button class="btn btn-primary btn-sm" style="flex:1" data-a="goneOut" data-id="' + o.id + '">' + ic('bike', 16) + ' Ya salió</button></div>'
        : o.mode === 'dom' ? '<a class="btn btn-primary btn-sm btn-block mt12" href="#/rest/enviar/' + o.id + '">' + ic('bike', 18) + ' Elegir domiciliario</a>'
        : '<button class="btn btn-green btn-sm btn-block mt12" data-a="pinAsk" data-id="' + o.id + '">Entregar (pedir código)</button>') + closeBits(o) + '</div></div>';
    }
    if (o.status === 'en_camino') {
      var rd = riderOf(o);
      return '<div class="order-card"><div class="ob">' + head + '<div class="small mt8">' + ic('bike', 14) + ' ' + (rd ? esc(rd.name) + (o.pickedAt ? ' · lo recogió a las ' + hora(o.pickedAt) : ' · enviado ' + ago(o.sentAt) + ', aún no marca recogido') : 'Lo lleva alguien del restaurante') + '</div>' + cust +
        '<div class="row mt12" style="gap:8px">' + (rd ? (ONLINE ? '<a class="btn btn-outline btn-sm" style="flex:1" target="_blank" rel="noopener" href="' + waLink(rd.phone, riderMsg(o)) + '">Reenviar</a>' : '<a class="btn btn-outline btn-sm" style="flex:1" href="#/wa/' + o.id + '">Ver chat</a>') : '') + '<button class="btn btn-green btn-sm" style="flex:1" data-a="pinAsk" data-id="' + o.id + '">Confirmar entrega</button></div>' + closeBits(o) + '</div></div>';
    }
    return '<div class="order-card" style="opacity:' + (o.status === 'entregado' ? 1 : .6) + '"><div class="ob">' + head + (o.status === 'entregado' && o.deliveredAt ? '<div class="xs muted mt4">' + ic('check', 12, { sw: 3 }) + ' Entregado a las ' + hora(o.deliveredAt) + (porTxt(o) ? ' · ' + porTxt(o) : '') + '</div>' : '') + ((o.status === 'no_entregado' || o.status === 'sin_respuesta') && o.rejectReason ? '<div class="xs muted mt4">' + esc(o.rejectReason) + '</div>' : '') + restIssue(o) + (o.rating ? '<div class="small mt4"><span style="color:var(--orange)">' + '★★★★★'.slice(0, o.rating) + '</span> ' + esc((o.tags || []).join(', ')) + '</div>' : '') + '</div></div>';
  }
  function restIssue(o) {
    if (!o.issue) return '';
    if (o.issueDoneAt) return '<div class="xs muted mt8">' + ic('check', 12, { sw: 3 }) + ' Reclamo resuelto: ' + esc(o.issue) + '</div>';
    var msg = 'Hola ' + first(o.customer.name) + ', somos ' + R(o.restId).name + '. Vimos tu mensaje sobre el pedido #' + o.id + ' («' + o.issue + '»). ';
    return '<div class="issue-box mt8"><div class="xs b">' + ic('alert', 13) + ' El cliente avisó: ' + esc(o.issue) + '</div>' + (o.issueNote ? '<div class="xs mt4">«' + esc(o.issueNote) + '»</div>' : '') +
      '<div class="row mt8" style="gap:8px"><a class="btn btn-green btn-xs" style="flex:1" target="_blank" rel="noopener" href="' + waLink(o.customer.phone, msg) + '">' + ic('msg', 14) + 'Escribirle</a>' +
      '<button class="btn btn-outline btn-xs" style="flex:1" data-a="issueDone" data-id="' + o.id + '">' + ic('check', 14, { sw: 2.6 }) + 'Resuelto</button></div></div>';
  }
  function scrEnviar(id) {
    var o = order(id); if (!o) return scrRest();
    var r = R(o.restId);
    var ids = (S.myRiders[r.id] || []).filter(function (x) { return S.riders[x]; });
    var sel = ui.choose['r' + id] || ids.filter(function (x) { return !riderBusy(x); })[0] || 'yo';
    ui.choose['r' + id] = sel;
    var rowsH = ids.map(function (rid) {
      var rd = S.riders[rid], busy = riderBusy(rid), c = avColor(rid), on = sel === rid;
      return '<button class="radio-row' + (on ? ' on' : '') + '" data-a="choose" data-id="' + id + '" data-v="' + rid + '"><span class="avatar sm" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(rd.name) + '</span><span class="grow"><span class="b" style="display:block">' + esc(rd.name) + '</span><span class="small muted">' + esc(rd.vehicle || 'Moto') + ' · ' + phoneFmt(rd.phone) + '</span></span>' +
        riderStatus(rid) + '<span class="ring"></span></button>';
    }).join('');
    rowsH += '<button class="radio-row' + (sel === 'yo' ? ' on' : '') + '" data-a="choose" data-id="' + id + '" data-v="yo"><span class="avatar sm" style="background:var(--track);color:var(--text)">' + ic('store', 18) + '</span><span class="grow"><span class="b" style="display:block">Lo llevo yo</span><span class="small muted">Alguien del restaurante</span></span><span class="ring"></span></button>';
    var rd = sel === 'yo' ? null : S.riders[sel];
    var early = o.status === 'preparando', times = early ? pickTimes(o) : [];
    if (early && times.indexOf(ui.choose['t' + id]) < 0) ui.choose['t' + id] = times[Math.min(1, times.length - 1)];
    var timeH = early ? '<div class="t-h2 mt20">¿A qué hora lo recoge?</div><div class="small muted mt4">Cuando la comida esté lista. Así llega a tiempo y no se enfría.</div><div class="chips mt8">' +
      times.map(function (t) { return '<button class="chip' + (ui.choose['t' + id] === t ? ' on' : '') + '" data-a="pickT" data-id="' + id + '" data-v="' + t + '">' + horaCo(t) + ' <span class="xs muted">(' + Math.max(0, Math.round((t - now()) / 60000)) + ' min)</span></button>'; }).join('') + '</div>' : '';
    return '<div class="screen has-cta">' + topbar('¿Quién lo lleva?', '/rest', 'Pedido #' + o.id + (early ? ' en preparación' : ' listo')) +
      '<div class="card row">' + cover(r, 'thumb s44') + '<div class="grow"><div class="b">' + esc(o.customer.name) + ' · ' + fmt(o.total) + ' ' + (o.pay === 'ef' ? 'efectivo' : o.pay) + '</div><div class="small muted ellipsis">' + esc(o.customer.address) + '</div></div></div>' +
      '<div class="row between mt20"><div class="t-h2">Mis domiciliarios</div><a class="link" href="#/rest/bolsa">Buscar más</a></div><div class="mt8">' + rowsH + '</div>' +
      '<button class="dashed-btn mt12" data-a="addRiderForm">' + ic('plus', 18) + ' Guardar un domiciliario</button>' + timeH +
      '<div class="note grey mt16 center">Le enviamos el pedido por WhatsApp' + (early ? ' con la hora para recogerlo' : '') + '. El pago lo acuerdan ustedes.</div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="sendRider" data-id="' + id + '">' + (rd ? (early ? 'Avisar a ' + esc(rd.name) + ' · ' + horaCo(ui.choose['t' + id]) : 'Enviar a ' + esc(rd.name)) : 'Lo llevo yo') + '</button></div>';
  }
  // Horas para recoger: cuando la comida debería estar lista (programado: 15 min antes; si no: el tiempo prometido menos ~15 min de camino).
  function pickTimes(o) {
    var step = 5 * 60000, up = function (t) { return Math.ceil(t / step) * step; };
    var minT = up(now() + step);
    var base = o.scheduledFor ? o.scheduledFor - 15 * 60000 : (o.acceptedAt || now()) + Math.max(10, (o.etaMin || 30) - 15) * 60000;
    base = Math.max(up(base), minT);
    var out = [];
    [-step, 0, step, 2 * step].forEach(function (d) { var t = base + d; if (t >= minT && out.indexOf(t) < 0) out.push(t); });
    return out;
  }
  // Quién lo lleva y a qué hora lo recoge (cuando se avisó mientras se cocinaba).
  function riderLine(o) {
    if (o.mode !== 'dom' || !o.riderId) return '';
    var rd = riderOf(o);
    if (!rd) return '<div class="small mt8">' + ic('store', 14) + ' Lo lleva alguien del restaurante' + (o.readyAt ? ' · sale ' + aLasCo(o.readyAt) : '') + '</div>';
    return '<div class="small mt8 row" style="gap:6px">' + ic('bike', 14) + '<span class="grow"><b>' + esc(rd.name) + '</b>' + (o.pickedAt ? ' · lo recogió a las ' + hora(o.pickedAt) : o.readyAt ? ' · recoge ' + aLasCo(o.readyAt) : '') + '</span>' +
      (o.status === 'preparando' && ONLINE ? '<a class="link xs" target="_blank" rel="noopener" href="' + waLink(rd.phone, riderMsg(o)) + '">Reenviar</a>' : '') + '</div>';
  }
  function riderMsg(o) {
    var r = R(o.restId);
    var cash = o.pay === 'ef' ? 'Cobrar ' + fmt(o.total) + ' en efectivo' + (o.cashGiven > o.total ? '. Paga con ' + fmt(o.cashGiven) + ', lleva ' + fmt(o.cashGiven - o.total) + ' de vueltas' : '') : 'Ya pagó por ' + (o.pay === 'nequi' ? 'Nequi' : 'Daviplata') + ' (no cobrar)';
    var early = o.status === 'preparando' && o.readyAt;
    return '*Domicilio #' + o.id + '* · ' + r.name + '\n' +
      (early ? '*Recoger ' + aLasCo(o.readyAt) + '* (lo estamos preparando)\n' : '') +
      'Recoger: ' + r.address + '\n' +
      'Entregar: ' + o.customer.address + '\n' +
      (o.geo ? 'Mapa: ' + mapsLink(o.geo) + '\n' : '') +
      'Cliente: ' + o.customer.name + ' · ' + phoneFmt(o.customer.phone) + '\n' +
      cash + '\n' +
      (ONLINE ? 'Tu enlace: toca *Ya lo recogí* al salir y *Entregado* con el código de 4 números del cliente: ' + location.href.split('#')[0] + '#/entrega/' + o.dbId + (o.riderKey ? '-' + o.riderKey : '')
        : 'Responde *RECOGIDO* al salir. Al entregar, pide el código de 4 números y responde: ENTREGADO + código');
  }
  function scrMisRiders() {
    var r = R(S.restId);
    var ids = (S.myRiders[r.id] || []).filter(function (x) { return S.riders[x]; });
    return '<div class="screen has-tabs">' + restHeader(r) + '<div class="row between mt20"><h1 class="t-title" style="font-size:22px">Mis domiciliarios</h1><a class="link" href="#/rest/bolsa">Buscar más</a></div>' +
      '<div class="small muted mt4">Tu propia lista. Tú eliges a quién mandar cada pedido; el pago lo acuerdan ustedes.</div>' +
      '<div class="card mt12" style="padding:4px 14px">' + (ids.length ? ids.map(function (rid) {
        var rd = S.riders[rid], c = avColor(rid), busy = riderBusy(rid);
        return '<div class="list-row"><span class="avatar sm" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(rd.name) + '</span><div class="grow"><div class="b ellipsis">' + esc(rd.name) + '</div><div class="small muted ellipsis">' + esc(rd.vehicle || 'Moto') + ' · ' + phoneFmt(rd.phone) + '</div></div>' +
          riderStatus(rid, true) +
          '<a class="icon-btn green" style="width:40px;height:40px" target="_blank" rel="noopener" href="' + waLink(rd.phone, 'Hola ' + first(rd.name) + ', te escribo de ' + r.name + '.') + '" aria-label="WhatsApp">' + ic('msg', 18) + '</a>' +
          '<button class="icon-btn" style="width:40px;height:40px;box-shadow:none;background:var(--track)" data-a="removeRider" data-v="' + rid + '" aria-label="Quitar">' + ic('x', 18) + '</button></div>';
      }).join('') : '<div class="empty">Aún no tienes domiciliarios guardados.</div>') + '</div>' +
      '<button class="dashed-btn mt12" data-a="addRiderForm">' + ic('plus', 18) + ' Guardar un domiciliario</button>' +
      '<div class="note amber mt16">Consejo de prueba: guarda tu propio número como domiciliario. Al enviarle un pedido te llega el mensaje de verdad a WhatsApp.</div></div>' + tabs('rest', 'riders');
  }
  function scrBolsa(fromRest) {
    var F = ui.bf;
    var list = Object.keys(S.riders).map(function (k) { return S.riders[k]; }).filter(function (rd) {
      if (!rd.board) return false;
      if (F.noche && (rd.hours || []).indexOf('Noche') < 0) return false;
      if (F.finde && (rd.hours || []).indexOf('Fines de semana') < 0) return false;
      if (F.moto && rd.vehicle !== 'Moto') return false;
      return true;
    });
    var my = S.myRiders[S.restId] || [];
    var r = R(S.restId), canSave = !ONLINE || !!S.restId;
    return '<div class="screen has-tabs">' + topbar('Bolsa de domiciliarios', fromRest ? '/rest/domiciliarios' : null) +
      '<div class="muted small" style="margin-top:-8px">Gente de Villanueva buscando trabajo. Escríbeles y acuerden pago y horario.</div>' +
      '<div class="chips mt12">' + [['noche', 'Noche'], ['finde', 'Fines de semana'], ['moto', 'Con moto']].map(function (f) { return '<button class="chip' + (F[f[0]] ? ' on' : '') + '" data-a="bf" data-v="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div><div class="mt12">' +
      (list.length ? list.map(function (rd) {
        var c = avColor(rd.id), saved = my.indexOf(rd.id) >= 0;
        return '<div class="card" style="margin-bottom:12px"><div class="row"><div class="avatar" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(rd.name) + '</div><div class="grow"><div class="t-h3">' + esc(rd.name) + (rd.id === S.myProfile ? ' <span class="badge orange">Tú</span>' : '') + '</div><div class="small muted">' + esc(rd.vehicle) + ' · ' + esc(rd.barrio) + '</div></div></div>' +
          '<div class="chips mt12" style="gap:6px">' + (rd.hours || []).map(function (hh) { return '<span class="badge grey">' + hh + '</span>'; }).join('') + (rd.docs || []).map(function (d) { return '<span class="badge green">' + ic('check', 12, { sw: 3 }) + ' ' + d + ' subida</span>'; }).join('') + '</div>' +
          '<div class="row mt12" style="gap:8px"><a class="btn btn-green btn-sm grow" target="_blank" rel="noopener" href="' + waLink(rd.phone, 'Hola ' + first(rd.name) + ', te vi en la bolsa de domiciliarios de Pido y Ido.' + (canSave ? ' Te escribo de ' + r.name + ', ¿tienes tiempo para hacer domicilios?' : '')) + '">' + ic('msg', 18) + ' Escribir por WhatsApp</a>' +
          (canSave ? '<button class="btn btn-sm ' + (saved ? 'btn-soft' : 'btn-outline') + '" data-a="saveRider" data-v="' + rd.id + '" aria-label="Guardar">' + ic(saved ? 'check' : 'bookmark', 18) + (saved ? ' Guardado' : ' Guardar') + '</button>' : '') + '</div></div>';
      }).join('') : '<div class="empty">Nadie con esos filtros todavía.</div>') +
      '</div><div class="note amber">Pido y Ido no revisa documentos ni recomienda a nadie. Revisa tú la licencia y el SOAT antes de trabajar con alguien.</div></div>' + (canSave ? tabs('rest', 'bolsa') : tabs('dom', 'perfil'));
  }

  // ---------- Rider ----------
  function scrDom() {
    var prof = S.myProfile && S.riders[S.myProfile];
    var assigned = ONLINE ? [] : S.orders.filter(function (o) { return o.riderId && o.riderId !== 'yo' && (o.status === 'en_camino' || o.status === 'entregado') && S.chats[o.id]; });
    assigned.sort(function (a, b) { return (b.sentAt || 0) - (a.sentAt || 0); });
    var h = '<div class="screen has-tabs">' + topbar('Mensajes', null, 'Domiciliario') +
      '<div class="small muted" style="margin-top:-8px">' + (ONLINE ? 'Los pedidos te llegan por WhatsApp desde el restaurante, con un enlace. Al entregar, abres el enlace y escribes el código de 4 números que te da el cliente.' : 'Los pedidos te llegan por WhatsApp desde el restaurante. Aquí ves cómo se ven y puedes probar la respuesta <b>ENTREGADO + código</b>.') + '</div>';
    if (assigned.length) {
      h += '<div class="card mt16" style="padding:4px 14px">' + assigned.map(function (o) {
        var r = R(o.restId), rd = riderOf(o);
        return '<a class="list-row" href="#/wa/' + o.id + '">' + logo(44, 'icon') + '<div class="grow"><div class="row between"><span class="b">' + r.name + '</span>' + statusBadge(o) + '</div><div class="small muted ellipsis">Para ' + esc(rd ? rd.name : '') + ' · Domicilio #' + o.id + '</div></div></a>';
      }).join('') + '</div>';
    } else if (!ONLINE) {
      h += '<div class="empty mt16"><div class="ic">' + ic('msg', 26) + '</div>Todavía no hay pedidos enviados a domiciliarios.<br>Desde el panel del restaurante, marca un pedido como listo y envíaselo a alguien.</div><a class="btn btn-outline btn-block" href="#/rest">Abrir panel del restaurante</a>';
    }
    h += '<div class="card mt16 row" style="background:var(--green);color:#fff"><div class="grow"><div class="t-h3">' + (prof ? 'Tu perfil está publicado' : '¿Tienes moto o bici?') + '</div><div class="small" style="opacity:.85">' + (prof ? 'Los restaurantes te pueden escribir.' : 'Publica tu perfil gratis en la bolsa.') + '</div></div><a class="btn btn-sm" style="background:#fff;color:var(--green)" href="#/dom/perfil">' + (prof ? 'Ver' : 'Empezar') + '</a></div>';
    return h + '</div>' + tabs('dom', 'msgs');
  }
  function scrDomPerfil() {
    var prof = S.myProfile && S.riders[S.myProfile];
    if (prof && !ui.editProfile) {
      var c = avColor(prof.id);
      return '<div class="screen has-tabs">' + topbar('Mi perfil') + '<div class="card center"><div class="avatar" style="margin:0 auto;width:72px;height:72px;font-size:24px;background:' + c[0] + ';color:' + c[1] + '">' + initials(prof.name) + '</div>' +
        '<div class="t-h2 mt12">' + esc(prof.name) + '</div><div class="small muted">' + esc(prof.vehicle) + ' · ' + esc(prof.barrio) + ' · ' + phoneFmt(prof.phone) + '</div>' +
        '<div class="chips mt12" style="justify-content:center;gap:6px">' + prof.hours.map(function (x) { return '<span class="badge grey">' + x + '</span>'; }).join('') + prof.docs.map(function (d) { return '<span class="badge green">' + d + ' subida</span>'; }).join('') + '</div>' +
        '<div class="note green mt16">Tu perfil está en la bolsa. Los restaurantes de Villanueva te escriben por WhatsApp.</div></div>' +
        '<a class="btn btn-outline btn-block mt12" href="#/rest/bolsa">Ver la bolsa</a><button class="btn btn-ghost btn-block mt8" data-a="editRiderProfile">Editar mi perfil</button><button class="btn btn-ghost btn-block" data-a="unpublish" style="color:#A1291B">Quitar mi perfil de la bolsa</button></div>' + tabs('dom', 'perfil');
    }
    if (!ui.signup) ui.signup = prof ? { name: prof.name, phone: prof.phone, barrio: prof.barrio, vehicle: prof.vehicle, hours: prof.hours.slice(), lic: prof.docs.indexOf('Licencia') >= 0, soat: prof.docs.indexOf('SOAT') >= 0 } : { name: '', phone: '', barrio: '', vehicle: 'Moto', hours: [], lic: false, soat: false };
    var f = ui.signup, err = ui.signupErr || {};
    return '<div class="screen flush has-tabs has-cta"><div class="status-head" style="padding-bottom:28px"><span class="badge" style="background:rgba(255,255,255,.14);color:#fff">Bolsa de domiciliarios · gratis</span><h1 class="mt12" style="font-size:26px;line-height:1.2;letter-spacing:-.4px">¿Tienes moto o bici? Trabaja con los restaurantes de Villanueva</h1></div>' +
      '<div class="pad mt16"><div class="row" style="gap:10px;align-items:flex-start"><div class="grow"><label class="label" for="sn">Nombre</label><input class="input' + (err.name ? ' err' : '') + '" id="sn" data-m="ui.signup.name" value="' + esc(f.name) + '" placeholder="Yesid Rojas" autocomplete="name"></div>' +
      '<div class="grow"><label class="label" for="sp">WhatsApp</label><input class="input' + (err.phone ? ' err' : '') + '" id="sp" data-m="ui.signup.phone" value="' + esc(f.phone) + '" inputmode="tel" placeholder="313 000 0000" autocomplete="tel"></div></div>' +
      (err.name || err.phone ? '<div class="err-msg">' + (err.name || err.phone) + '</div>' : '') +
      '<label class="label mt12" for="sb">Barrio</label><input class="input' + (err.barrio ? ' err' : '') + '" id="sb" data-m="ui.signup.barrio" value="' + esc(f.barrio) + '" placeholder="Los Libertadores">' +
      '<div class="label mt16">Vehículo</div><div class="row" style="gap:10px">' + ['Moto', 'Bicicleta'].map(function (v) { var on = f.vehicle === v; return '<button class="btn grow" data-a="veh" data-v="' + v + '" style="border:' + (on ? '2px solid var(--green)' : '1.5px solid var(--border)') + ';background:' + (on ? 'var(--gsoft)' : '#fff') + ';color:' + (on ? 'var(--green)' : 'var(--text)') + ';font-size:15px;font-weight:600">' + v + '</button>'; }).join('') + '</div>' +
      '<div class="label mt16">¿Cuándo puedes trabajar?</div><div class="chips">' + ['Mañana', 'Mediodía', 'Noche', 'Fines de semana'].map(function (x) { return '<button class="chip' + (f.hours.indexOf(x) >= 0 ? ' on' : '') + '" data-a="hrs" data-v="' + x + '">' + x + '</button>'; }).join('') + '</div>' +
      (err.hours ? '<div class="err-msg">' + err.hours + '</div>' : '') +
      '<div class="label mt16">Documentos (opcional)</div><div class="row" style="gap:10px">' +
      '<label class="photo-up' + (f.lic ? ' done' : '') + '">' + ic(f.lic ? 'check' : 'camera', 18) + (f.lic ? 'Licencia' : 'Foto licencia') + '<input type="file" accept="image/*" data-file="lic"></label>' +
      '<label class="photo-up' + (f.soat ? ' done' : '') + '">' + ic(f.soat ? 'check' : 'camera', 18) + (f.soat ? 'SOAT' : 'Foto SOAT') + '<input type="file" accept="image/*" data-file="soat"></label></div>' +
      '<div class="note grey mt16 center"><b style="color:var(--text)">Pido y Ido no es tu empleador ni te asigna pedidos.</b> El pago y el horario los acuerdas con cada restaurante.</div></div></div>' +
      '<div class="cta-wrap above-tabs"><button class="btn btn-primary btn-xl btn-block" data-a="publish">' + (prof ? 'Guardar cambios' : 'Publicar mi perfil') + '</button></div>' + tabs('dom', 'perfil');
  }
  function scrWa(id) {
    var o = order(id); if (!o) return scrDom();
    var r = R(o.restId), rd = riderOf(o);
    var chat = S.chats[id] || [];
    var d = r.dishes.filter(function (x) { return o.items[0] && x.id === o.items[0].id; })[0];
    var cash = o.pay === 'ef' ? '<b>Cobrar ' + fmt(o.total) + ' en efectivo</b>' + (o.cashGiven > o.total ? '<br>Paga con ' + fmt(o.cashGiven) + ' · lleva ' + fmt(o.cashGiven - o.total) + ' de vueltas' : '') : '<b>Ya pagó por ' + (o.pay === 'nequi' ? 'Nequi' : 'Daviplata') + '.</b> No cobrar.';
    var mapQ = o.geo ? o.geo.lat + ',' + o.geo.lng : o.customer.address + ', Villanueva, Casanare';
    var h = '<div class="wa"><div class="wa-head"><a href="#/dom" aria-label="Volver" style="padding:6px">' + ic('back', 22) + '</a>' + logo(40, 'icon') + '<div class="grow"><div class="b">' + r.name + '</div><div class="xs muted">vía Pido y Ido · WhatsApp de ' + esc(rd ? rd.name : 'domiciliario') + '</div></div></div><div class="wa-body">' +
      '<div class="day-pill">Hoy ' + hora(o.sentAt || now()) + '</div>' +
      '<div class="bubble order">' + photo(d ? d.img : r.img, '', 'height:120px;width:100%') + '<div style="padding:10px 12px"><div class="b" style="color:var(--cta);font-size:15px">Domicilio #' + o.id + '</div>' +
      '<div class="mt8"><b>Recoger:</b> ' + r.name + ', ' + r.address + '</div><div class="mt4"><b>Entregar:</b> ' + esc(o.customer.address) + '</div><div class="mt4"><b>Cliente:</b> ' + esc(o.customer.name) + ' · ' + phoneFmt(o.customer.phone) + '</div>' +
      '<div class="note soft mt8">' + cash + '</div><div class="small muted mt8">Al entregar, pide el código de 4 números y responde: <b>ENTREGADO + código</b></div><div class="time">' + hora(o.sentAt || now()) + '</div></div>' +
      '<button class="wa-qr" data-a="waQuick" data-id="' + id + '" data-v="Ya lo recogí">Ya lo recogí</button><a class="wa-qr" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQ) + '">Ver en el mapa</a></div>';
    h += chat.map(function (m) {
      return '<div class="bubble' + (m.out ? ' out' : '') + '">' + (m.ok ? '<span class="green">' + ic('check', 16, { sw: 3 }) + '</span> ' : '') + esc(m.text) + '<div class="time">' + hora(m.t) + (m.out ? ' ✓✓' : '') + '</div></div>';
    }).join('');
    h += '</div>' + (o.status === 'en_camino' ? '<div class="wa-input"><input id="wamsg" placeholder="Escribe: ENTREGADO ' + '1234" autocomplete="off" data-enter="waSend" data-id="' + id + '"><button data-a="waSend" data-id="' + id + '" aria-label="Enviar">' + ic('send', 20) + '</button></div>'
      : '<div class="wa-input" style="justify-content:center"><a class="btn btn-outline btn-sm" href="#/pedido/' + id + '">Ver el pedido como cliente</a></div>') + '</div>';
    return h;
  }

  // ---------- Restaurant: menu + data (online) ----------
  var PHOTOS = [['Asado', IMG.asado], ['Carne', IMG.carne], ['Parrilla', IMG.parrilla], ['Pollo', IMG.pollo], ['Empanadas', IMG.emp], ['Arepas', IMG.arepa], ['Almuerzo', IMG.almuerzo], ['Pescado', IMG.pescado], ['Hamburguesa', IMG.burger], ['Pizza', IMG.pizza], ['Pizza 2', IMG.pizza2], ['Pincho', IMG.pincho], ['Jugo', IMG.jugo]];
  // Gallery of stock photos + "upload your own" tile. kind = 'rest' (cover) | 'dish'
  function ownCats(f) { var fixed = CATS.map(function (c) { return c[0]; }); return (f.cats || []).filter(function (c) { return fixed.indexOf(c) < 0; }); }
  function photoPick(cur, action, kind, noStock) {
    var own = cur && !PHOTOS.some(function (p) { return p[1] === cur; });
    var tile = 'padding:0;border-radius:14px;overflow:hidden;width:64px;height:64px;flex:none;';
    return '<div class="pick-row mt8">' +
      '<label class="pick-up" style="' + tile + '">' + ic(ui.upBusy ? 'refresh' : 'camera', 20) + '<span>' + (ui.upBusy ? 'Subiendo' : 'Tu foto') + '</span><input type="file" accept="image/*" data-file="' + (kind === 'dish' ? 'dishImg' : 'restImg') + '"></label>' +
      (own ? '<button aria-label="Tu foto" class="pick on" style="' + tile + '">' + photo(cur, '', 'width:100%;height:100%', 200) + '</button>' : '') +
      (noStock ? '' : PHOTOS.map(function (p) {
        return '<button data-a="' + action + '" data-v="' + esc(p[1]) + '" aria-label="' + p[0] + '" class="pick' + (cur === p[1] ? ' on' : '') + '" style="' + tile + '">' + photo(p[1], '', 'width:100%;height:100%', 200) + '</button>';
      }).join('')) + '</div>';
  }
  // Shrink + crop a phone photo before upload (cover 3:2, dish square), JPEG.
  function shrinkPhoto(file, kind) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        if (kind === 'list') {
          var m = Math.min(1, 1400 / Math.max(im.width, im.height)), c0 = document.createElement('canvas');
          c0.width = Math.round(im.width * m); c0.height = Math.round(im.height * m);
          c0.getContext('2d').drawImage(im, 0, 0, c0.width, c0.height); URL.revokeObjectURL(url);
          return c0.toBlob(function (b) { b ? ok({ blob: b, dataUrl: c0.toDataURL('image/jpeg', 0.7) }) : bad(new Error('img')); }, 'image/jpeg', 0.8);
        }
        var W = kind === 'dish' ? 640 : 1200, H = kind === 'dish' ? 640 : 800;
        var sc = Math.max(W / im.width, H / im.height), sw = W / sc, sh = H / sc;
        if (sc > 1) { W = Math.round(W / sc); H = Math.round(H / sc); sc = 1; sw = W; sh = H; }
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        c.getContext('2d').drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 0, 0, W, H);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok({ blob: b, dataUrl: c.toDataURL('image/jpeg', 0.72) }) : bad(new Error('img')); }, 'image/jpeg', 0.78);
      };
      im.onerror = function () { URL.revokeObjectURL(url); bad(new Error('img')); };
      im.src = url;
    });
  }
  function uploadOwnPhoto(file, kind) {
    if (ui.upBusy) return;
    ui.upBusy = true; refreshPick(kind);
    shrinkPhoto(file, kind).then(function (x) {
      if (!ONLINE) return x.dataUrl; // demo: stays on this phone
      if (!CLOUD.uploadPhoto) throw new Error('no_upload');
      return CLOUD.uploadPhoto(x.blob);
    }).then(function (src) {
      ui.upBusy = false;
      if (kind === 'dish') { ui.dish.img = src; } else if (ui.rm) { ui.rm.img = src; }
      refreshPick(kind); toast(kind === 'dish' ? 'Foto lista' : 'Foto lista. Toca Guardar datos.');
    }, function (e) {
      ui.upBusy = false; refreshPick(kind);
      toast(/bucket|not found|no_upload|row-level|policy/i.test(String(e && e.message)) ? 'Subir tus propias fotos se activa muy pronto. Por ahora elige una de la lista.' : 'No se pudo subir la foto. Revisa tu internet.');
    });
  }
  function refreshPick(kind) {
    if (kind === 'dish') { var w = document.getElementById('dishPh'); if (w) w.innerHTML = photoPick(ui.dish.img, 'dishImg', 'dish'); }
    else render();
  }
  var RM_KEYS = ['name', 'sub', 'address', 'phone', 'nequi', 'fee', 'min', 'eta', 'img', 'cats', 'lat', 'lng', 'radius', 'kind', 'abre', 'cierra', 'hor'];
  // Horario por día solo cuando la base de datos ya tiene el paso 012-horario.sql.
  function horOn() { return !ONLINE || RESTAURANTS.some(function (r) { return r.horOk; }); }
  function horDe(r) { return r.hor !== undefined ? r.hor : r.horario ? JSON.parse(JSON.stringify(r.horario)) : DIAS.map(function () { return [abreDe(r), cierraDe(r)]; }); }
  function rmVal(r, k) { var v = k === 'radius' ? (r.radius || 3) : k === 'kind' ? (r.kind || 'restaurante') : k === 'abre' ? abreDe(r) : k === 'cierra' ? cierraDe(r) : k === 'hor' ? (horOn() ? horDe(r) : '') : r[k]; return JSON.stringify(v == null ? '' : v); }
  function rmDirty(r, f) { return RM_KEYS.some(function (k) { return rmVal(f, k) !== rmVal(r, k); }); }
  function hourSelect(id, path, cur, from, to) {
    var h = '<select class="input" id="' + id + '" data-m="' + path + '" data-dirty="1">';
    for (var m = from; m <= to; m += 30) { var v = (m < 600 ? '0' : '') + Math.floor(m / 60) + ':' + (m % 60 ? '30' : '00'); h += '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + hmTxt(v) + '</option>'; }
    return h + '</select>';
  }
  // Editor del horario: una fila por día, empezando el lunes. Cada día abierto (abre / cierra) o cerrado.
  function horEditor(f) {
    var rows = [1, 2, 3, 4, 5, 6, 0].map(function (i) {
      var d = f.hor[i];
      return '<div class="hor-row' + (d ? '' : ' off') + '"><button class="hor-day" data-a="horDay" data-v="' + i + '" aria-pressed="' + !!d + '"><span class="tr-mini"></span>' + capi(DIAS[i]).slice(0, 3) + '</button>' +
        (d ? '<div class="hor-sel">' + hourSelect('rmH' + i + 'a', 'ui.rm.hor.' + i + '.0', d[0], 5 * 60, 20 * 60) + '<span class="muted">a</span>' + hourSelect('rmH' + i + 'c', 'ui.rm.hor.' + i + '.1', d[1], 8 * 60, 23 * 60 + 30) + '</div>'
          : '<div class="hor-closed muted">Cerrado todo el día</div>') + '</div>';
    }).join('');
    return '<h2 class="t-h2 mt24">Horario</h2><div class="card mt12 hor-card">' + rows +
      '<button class="chip sm mt12" data-a="horCopy">' + ic('refresh', 14) + 'Copiar el lunes a los demás días</button>' +
      '<div class="xs muted mt12">Los clientes ven <b>«Abierto hasta …»</b> o <b>«Cerrado · abre …»</b>. Fuera de este horario no te llegan pedidos para ya, solo <b>pedidos programados</b> para cuando abras. ¿Un día no abres o estás muy ocupado? Toca <b>Abierto</b> arriba para pausar.</div></div>';
  }
  function scrRestMenu() {
    var r = R(S.restId);
    var f = ui.rm && ui.rm.id === r.id ? ui.rm : (ui.rm = { id: r.id, kind: r.kind || 'restaurante', name: r.name, sub: r.sub, address: r.address, phone: r.phone, nequi: r.nequi, fee: r.fee, min: r.min, eta: r.eta, img: r.img, cats: r.cats.slice(), lat: r.lat, lng: r.lng, radius: r.radius || 3, abre: abreDe(r), cierra: cierraDe(r), hor: horOn() ? horDe(r) : undefined });
    var shop = isShop(f), k = kindOf(f), word = shop ? 'tienda' : 'restaurante';
    var chip = function (key, val, label) { return '<button class="chip sm' + (String(f[key]) === String(val) ? ' on' : '') + '" data-a="rmSet" data-k="' + key + '" data-v="' + esc(val) + '">' + label + '</button>'; };
    var dirty = rmDirty(r, f);
    var h = '<div class="screen has-tabs' + (dirty ? ' has-cta' : '') + '">' + restHeader(r) +
      // cover photo, as customers see it
      '<div class="cover mt16">' + cover(f, '', 'position:absolute;inset:0;width:100%;height:100%', 900) + '<div class="cover-fade"></div>' +
      '<div class="cover-txt"><div class="xs" style="opacity:.85">Así te ven los clientes</div><div class="t-h2" style="color:#fff">' + esc(f.name || r.name) + '</div></div></div>' +
      '<div class="label mt12">Foto de portada' + (shop ? ' <span class="muted" style="font-weight:500">(opcional: tu local o tus productos)</span>' : '') + '</div>' + photoPick(f.img, 'rmImg', 'rest', shop) +
      (shop ? '<h2 class="t-h2 mt24">Cómo te piden</h2><div class="card mt12"><div class="row top" style="gap:12px"><span class="pi">' + ic('list', 18) + '</span><div class="grow small">Tus clientes <b>escriben su lista</b> o te mandan <b>una foto</b>' + (k.id === 'drogueria' ? ' (por ejemplo de la fórmula)' : '') + '. Tú pones el precio al aceptar y el cliente lo ve en su app. No necesitas subir productos.</div></div></div>' : '') +
      // dishes
      (shop ? '' : '<div class="row between mt24"><h2 class="t-h2">Tu menú</h2><span class="small muted">' + r.dishes.length + ' platos</span></div>' +
      '<div class="card mt12" style="padding:4px 14px">' +
      (r.dishes.length ? r.dishes.map(function (d) {
        return '<div class="list-row">' + photo(d.img, 'thumb') + '<div class="grow"><div class="b ellipsis">' + esc(d.name) + '</div><div class="small muted ellipsis">' + (d.desc ? esc(d.desc) : 'Sin descripción') + '</div><div class="row mt4" style="gap:8px"><span class="b" style="font-size:14px">' + fmt(d.price) + '</span><button class="sec-pill" data-a="dishSec" data-v="' + esc(d.id) + '">' + esc(secOf(d)) + ' ' + ic('down', 12) + '</button></div></div>' +
          '<button class="icon-btn" style="width:40px;height:40px;box-shadow:none;background:var(--track)" data-a="dishDel" data-v="' + esc(d.id) + '" aria-label="Quitar">' + ic('x', 18) + '</button></div>';
      }).join('') : '<div class="empty" style="padding:22px 8px"><div class="ic">' + ic('fire', 24) + '</div>Aún no hay platos. Agrega el primero: con foto y precio se vende más.</div>') + '</div>' +
      '<button class="dashed-btn mt12" data-a="dishForm">' + ic('plus', 18) + ' Agregar un plato</button>') +
      // delivery
      '<h2 class="t-h2 mt24">Entrega</h2><div class="card mt12">' +
      '<div class="label">Ubicación ' + (shop ? 'de la tienda' : 'del restaurante') + '</div><button class="dashed-btn' + (hasLoc(f) ? ' done' : ' need') + '" data-a="rmLoc">' + ic(hasLoc(f) ? 'check' : 'map', 18) + (hasLoc(f) ? 'Marcado en el mapa · cambiar' : 'Marcar mi ' + word + ' en el mapa') + '</button>' +
      '<div class="label mt16">¿Hasta dónde entregas?</div><div class="chips">' + [2, 3, 5, 8].map(function (v) { return chip('radius', v, v + ' km'); }).join('') + '</div>' +
      '<div class="label mt16">Domicilio</div><div class="chips">' + [0, 2000, 3000, 4000, 5000].map(function (v) { return chip('fee', v, v ? fmt(v) : 'Gratis'); }).join('') + '</div>' +
      (shop ? '' : '<div class="label mt16">Pedido mínimo</div><div class="chips">' + [0, 10000, 15000, 20000].map(function (v) { return chip('min', v, v ? fmt(v) : 'Sin mínimo'); }).join('') + '</div>') +
      '<div class="label mt16">Tiempo de entrega</div><div class="chips">' + ['20–30 min', '30–40 min', '40–60 min'].map(function (v) { return chip('eta', v, v); }).join('') + '</div></div>' +
      // opening hours: per weekday (012) or one range for every day (009)
      (horOn() ? horEditor(f) : progOn() ? '<h2 class="t-h2 mt24">Horario</h2><div class="card mt12"><div class="row" style="gap:10px">' +
      '<div class="grow"><label class="label" for="rmAb">Abre</label>' + hourSelect('rmAb', 'ui.rm.abre', f.abre, 5 * 60, 14 * 60) + '</div>' +
      '<div class="grow"><label class="label" for="rmCi">Cierra</label>' + hourSelect('rmCi', 'ui.rm.cierra', f.cierra, 12 * 60, 23 * 60 + 30) + '</div></div>' +
      '<div class="xs muted mt8">Los clientes pueden <b>programar pedidos</b> para hoy o mañana dentro de este horario, también cuando estás cerrado. Tú los aceptas igual que los demás.</div></div>' : '') +
      // details
      '<h2 class="t-h2 mt24">Datos ' + (shop ? 'de la tienda' : 'del restaurante') + '</h2><div class="card mt12">' +
      '<div class="label">Tipo de negocio</div><div class="chips" style="margin-bottom:14px">' + KINDS.map(function (x) { return '<button class="chip sm' + (x.id === k.id ? ' on' : '') + '" data-a="rmSet" data-k="kind" data-v="' + x.id + '">' + ic(x.icon, 14) + x.t + '</button>'; }).join('') + '</div>' +
      '<div class="field"><label class="label" for="rm1">Nombre</label><input class="input" id="rm1" data-m="ui.rm.name" data-dirty="1" value="' + esc(f.name) + '"></div>' +
      '<div class="field"><label class="label" for="rm2">Qué vendes (corto)</label><input class="input" id="rm2" data-m="ui.rm.sub" data-dirty="1" value="' + esc(f.sub) + '" placeholder="' + esc(k.sub) + '"></div>' +
      '<div class="field"><label class="label" for="rm3">Dirección</label><input class="input" id="rm3" data-m="ui.rm.address" data-dirty="1" value="' + esc(f.address) + '"></div>' +
      '<div class="row" style="gap:10px"><div class="grow field"><label class="label" for="rm4">WhatsApp</label><input class="input" id="rm4" data-m="ui.rm.phone" data-dirty="1" inputmode="tel" value="' + esc(f.phone) + '"></div>' +
      '<div class="grow field"><label class="label" for="rm5">Nequi / Daviplata</label><input class="input" id="rm5" data-m="ui.rm.nequi" data-dirty="1" inputmode="tel" value="' + esc(f.nequi) + '"></div></div>' +
      '<div class="xs muted" style="margin:-6px 0 8px">' + ic('lock', 12) + ' Los clientes no ven tu WhatsApp. El Nequi solo lo ve quien tiene un pedido aceptado contigo.</div>' +
      (shop ? '' : '<div class="label mt8">Categorías</div><div class="chips">' + CATS.map(function (c) { return '<button class="chip sm' + (f.cats.indexOf(c[0]) >= 0 ? ' on' : '') + '" data-a="rmCat" data-v="' + esc(c[0]) + '">' + esc(c[0]) + '</button>'; }).join('') +
        ownCats(f).map(function (c) { return '<button class="chip sm on" data-a="rmCat" data-v="' + esc(c) + '" aria-label="Quitar ' + esc(c) + '">' + esc(c) + ' ' + ic('x', 12) + '</button>'; }).join('') + '</div>' +
        (ownCats(f).length < 3 ? '<div class="row mt8" style="gap:8px"><input class="input grow" id="rmCatNew" data-m="ui.rm.catNew" data-enter="rmCatAdd" maxlength="20" value="' + esc(f.catNew || '') + '" placeholder="Otra, ej.: Mariscos"><button class="btn btn-ghost btn-sm" data-a="rmCatAdd">Agregar</button></div>' : '')) +
      '<button class="btn btn-green btn-block mt16" data-a="rmSave"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Guardando…' : 'Guardar datos') + '</button></div>' +
      '<button class="btn btn-ghost btn-block mt12" data-a="restLogout">Cerrar sesión</button></div>' +
      '<div class="cta-wrap above-tabs save-bar' + (dirty ? ' show' : '') + '" id="saveBar"><button class="btn btn-green btn-block" data-a="rmSave"' + (ui.busy ? ' disabled' : '') + '>' + ic('check', 18) + (ui.busy ? 'Guardando…' : 'Guardar cambios') + '</button></div>' + tabs('rest', 'menu');
    return h;
  }
  // Enlace del domiciliario: #/entrega/<id>-<clave>. Paso 1 "Ya lo recogí", paso 2 "Entregado" con el código del cliente.
  function scrEntrega(ref) {
    var e = ui.ent && ui.ent.ref === ref ? ui.ent : null;
    if (!e) {
      var parts = String(ref || '').split('-');
      ui.ent = { ref: ref, id: +parts[0], key: parts[1] || '', info: null, msg: '', done: false };
      CLOUD.orderForRider(ui.ent.id, ui.ent.key).then(function (info) { if (ui.ent && ui.ent.ref === ref) { ui.ent.info = info || { missing: true }; render(); } }, function (err) { if (ui.ent) { ui.ent.info = { missing: true }; ui.ent.msg = errTxt(err); render(); } });
      e = ui.ent;
    }
    var i = e.info;
    var h = '<div class="screen flush has-cta auth">' + authHero('Pido y Ido · domiciliario', 'Tu domicilio', null).replace('auth-tag">Restaurantes', 'auth-tag">Domicilios').replace(IMG_ESC_ASADO, IMG_ESC_MOTO) + '<div class="auth-body">';
    if (!i) return h + '<div class="skel" style="height:120px"></div><div class="skel mt12" style="height:150px"></div></div></div>';
    if (i.missing) return h + '<div class="card center"><div class="t-h3">No encontramos este pedido</div><div class="small muted mt4">' + (e.msg ? esc(e.msg) : 'Revisa el enlace que te mandó el restaurante, o pídele que te lo reenvíe.') + '</div></div></div></div>';
    var cobrar = i.pay === 'ef' ? 'Cobrar ' + fmt(i.total) + ' en efectivo' : i.pay_ok === false ? 'El pago por ' + (i.pay === 'nequi' ? 'Nequi' : 'Daviplata') + ' no ha llegado. Habla con el restaurante antes de entregar.' : i.pay ? 'Ya pagó por ' + (i.pay === 'nequi' ? 'Nequi' : 'Daviplata') + ' · no cobrar' : '';
    h += '<div class="card"><div class="row between"><span class="badge dark">Domicilio #' + String(i.id).padStart(4, '0') + '</span>' + (i.total ? '<span class="b">' + fmt(i.total) + '</span>' : '') + '</div>' +
      '<div class="route mt12"><div class="route-row"><span class="rdot from">' + ic('store', 14) + '</span><div><div class="xs muted">Recoger en</div><div class="b">' + esc(i.rest) + '</div></div></div>' +
      '<div class="route-row"><span class="rdot to">' + ic('pin', 14) + '</span><div><div class="xs muted">Entregar a ' + esc(i.name) + '</div><div class="b">' + esc(i.address) + '</div></div></div></div>' +
      (cobrar ? '<div class="note ' + (i.pay === 'ef' || i.pay_ok === false ? 'amber' : 'green') + ' mt12">' + cobrar + '</div>' : '') + '</div>';
    if (e.done || i.status === 'entregado') {
      var por = e.done ? '' : i.delivered_by === 'cliente' ? 'El cliente confirmó que lo recibió.' : i.delivered_by === 'negocio' ? 'El restaurante lo confirmó.' : i.delivered_by === 'auto' ? 'Se cerró solo después de ' + AUTO_H + ' horas.' : '';
      return h + '<div class="card mt12 center"><div class="big-check pop">' + ic('check', 44, { sw: 2.6 }) + '</div><div class="t-h2 mt12">¡Pedido entregado!</div><div class="small muted mt4">' + (por ? por + ' ' : '') + 'Gracias. El restaurante ya lo ve como entregado.</div></div></div></div>';
    }
    if (['preparando', 'listo', 'en_camino'].indexOf(i.status) < 0) return h + '<div class="note amber mt12">Este pedido ya no está activo (' + esc(STATUS_TXT[i.status] || i.status) + ').</div></div></div>';
    var picked = i.picked_at ? new Date(i.picked_at).getTime() : 0;
    if (!picked && i.ready_at) {
      var rt = new Date(i.ready_at).getTime();
      h += '<div class="prog-box mt12">' + ic('clock', 20, { sw: 2.2 }) + '<div class="grow"><div class="b">Recoger ' + aLasCo(rt) + '</div><div class="xs">' + (i.status === 'preparando' ? 'Lo están preparando. Llega a esa hora para que no se enfríe.' : '¡Ya está listo! Pasa por él.') + '</div></div></div>';
    }
    h += '<div class="card mt12"><div class="row" style="gap:10px"><span class="step-n' + (picked ? ' ok' : '') + '">' + (picked ? ic('check', 16, { sw: 3 }) : '1') + '</span><div class="grow"><div class="b">' + (picked ? 'Recogido a las ' + hora(picked) : '¿Ya lo recogiste?') + '</div><div class="small muted">' + (picked ? 'El cliente ve que su pedido va en camino.' : 'Tócalo al salir del local. El cliente ve que va en camino.') + '</div></div></div>' +
      (picked ? '' : '<button class="btn btn-green btn-block mt12" data-a="entregaPick"' + (ui.busy ? ' disabled' : '') + '>' + ic('bike', 18) + ' Ya lo recogí</button>') + '</div>';
    if (!picked && i.status === 'preparando') return h + '<div class="err-msg center">' + esc(e.msg || '') + '</div><div class="card mt12 row" style="gap:10px;opacity:.6"><span class="step-n">2</span><div class="grow"><div class="b">Al entregar, pídele el código</div><div class="small muted">Aparece cuando lo recojas.</div></div></div></div></div>';
    return h + '<div class="card mt12 center"><div class="row" style="gap:10px;text-align:left"><span class="step-n">2</span><div class="grow"><div class="b">Al entregar, pídele el código</div><div class="small muted">Son 4 números. El cliente los ve en su app.</div></div></div>' +
      '<label class="pin-wrap mt16"><input id="entPin" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" maxlength="4" aria-label="Código de 4 números" data-enter="entregaDo" data-pin="1">' +
      '<span class="pin-boxes" aria-hidden="true"><i></i><i></i><i></i><i></i></span></label>' +
      '<div class="err-msg center">' + esc(e.msg || '') + '</div><div class="xs muted mt8">¿El cliente no tiene el código a mano? Puede tocar <b>Ya lo recibí</b> en su app.</div></div></div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="entregaDo"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Revisando…' : ic('check', 20) + 'Entregado') + '</button></div>';
  }

  // ---------- Promoter ----------
  function promoLink(restId) {
    var base = location.href.split('#')[0];
    return base + '#/r/' + restId + '?p=' + S.promo.slug;
  }
  function scrPromo() {
    if (ONLINE) {
      var list = shown();
      if (!list.length) return '<div class="screen has-tabs">' + topbar('Recomienda y gana') + '<div class="empty">' + (ui.synced ? 'Pronto vas a poder recomendar los restaurantes de Villanueva.' : 'Cargando…') + '</div></div>' + tabs('promo', 'enlace');
      if (!R(S.promo.restId).id) S.promo.restId = list[0].id;
      if (!S.promo.slug) {
        if (!ui.promoAsk) { ui.promoAsk = true; CLOUD.ensurePromoter(String(first(S.user.name) || 'p').toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) || 'p').then(function (slug) { S.promo.slug = slug; save(); render(); }, function (e) { ui.promoAsk = false; toast(errTxt(e)); }); }
        return '<div class="screen has-tabs">' + topbar('Recomienda y gana') + '<div class="empty">Creando tu enlace…</div></div>' + tabs('promo', 'enlace');
      }
    }
    var pr = R(S.promo.restId);
    var link = promoLink(pr.id);
    var pretty = link.replace(/^https?:\/\//, '');
    return '<div class="screen has-tabs has-cta"><span class="badge orange">Recomienda y gana</span><h1 class="t-title mt12">Comparte tu restaurante favorito</h1>' +
      '<div class="muted mt8">Ganas <b style="color:var(--text)">' + S.promo.pct + '%</b> <button class="badge amber" data-a="pctEdit" style="vertical-align:1px">ejemplo · cambiar</button> de cada pedido entregado que llegue con tu enlace.</div>' +
      '<div class="row mt16" style="gap:10px;overflow-x:auto">' + shown().map(function (x) {
        var on = x.id === pr.id;
        return '<button class="card flat row grow" style="padding:10px;gap:8px;' + (on ? 'border:2px solid var(--orange)' : '') + '" data-a="promoRest" data-v="' + x.id + '">' + cover(x, 'thumb', 'width:36px;height:36px;border-radius:999px') + '<span class="small b ellipsis" style="text-align:left">' + x.short + '</span></button>';
      }).join('') + '</div>' +
      '<div class="qr-card mt16"><div class="qr-wrap"><canvas id="qr" width="210" height="210"></canvas><div class="qr-logo">' + logo(40, 'icon') + '</div></div><div class="t-h3 mt12">' + pr.name + '</div>' +
      '<div class="linkbox"><span>' + esc(pretty) + '</span><button class="btn btn-soft btn-sm" style="height:38px" data-a="copyLink">' + ic('copy', 16) + ' Copiar</button></div>' +
      '<button class="btn btn-ghost btn-block mt8" data-a="downloadQR" style="color:var(--green)">' + ic('download', 18) + ' Descargar QR para imprimir</button>' +
      '<a class="small muted" href="' + esc('#/r/' + pr.id + '?p=' + S.promo.slug) + '" style="text-decoration:underline">Probar el enlace aquí</a></div>' +
      '<div class="steps mt20"><div><div class="n">1</div><div class="small muted">Compartes tu enlace o QR</div></div><div><div class="n">2</div><div class="small muted">Tus conocidos piden</div></div><div><div class="n">3</div><div class="small muted">Te pagamos a Nequi</div></div></div></div>' +
      '<div class="cta-wrap above-tabs"><a class="btn btn-primary btn-xl btn-block" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('¿Ya probaste ' + pr.name + '? Pide aquí y te lo llevan a la casa: ' + link) + '">' + ic('share', 20) + ' Compartir por WhatsApp</a></div>' + tabs('promo', 'enlace');
  }
  function promoReal() {
    if (ONLINE) {
      if (!ui.promoAt || now() - ui.promoAt > 15000) {
        ui.promoAt = now();
        CLOUD.promoOrders().then(function (rows) {
          var next = rows.map(function (x) { return { id: String(x.id).padStart(4, '0'), restId: x.rest_id, subtotal: x.subtotal, status: x.status, customer: { phone: x.cust } }; });
          var changed = JSON.stringify(next) !== JSON.stringify(ui.promoRows || []);
          ui.promoRows = next; if (changed && parse().parts[1] === 'ganancias') render();
        }, function () {});
      }
      return (ui.promoRows || []).slice().reverse();
    }
    return S.orders.filter(function (o) { return o.ref && o.ref.slug === S.promo.slug; });
  }
  function scrGanancias() {
    var real = promoReal();
    var X = ONLINE ? { w: [0, 0, 0], t: 0, cl: 0, del: 0, pay: 0 } : { w: [9800, 14200, 12200], t: 48600, cl: 14, del: 31, pay: 12400 };
    var del = real.filter(function (o) { return o.status === 'entregado'; });
    var realSum = del.reduce(function (a, o) { return a + Math.round(o.subtotal * S.promo.pct / 100); }, 0);
    var month = new Date().toLocaleDateString('es-CO', { month: 'long' });
    var weeks = X.w.concat([X.pay + realSum]);
    var max = Math.max.apply(null, weeks.concat([1]));
    var total = X.t + realSum;
    var ex = ONLINE ? [] : [
      { t: '#0139 · La Plaza', s: 'Pedido 2 de 3', a: 1200, img: IMG.pizza2 },
      { t: '#0137 · El Llanero', s: 'Cliente nuevo · pedido 1 de 3', a: 980, img: IMG.pollo },
      { t: '#0136 · El Llanero', s: 'Cancelado · no suma', a: 0, img: IMG.emp, x: true }
    ];
    var rows = real.slice().reverse().map(function (o) {
      var ok = o.status === 'entregado', bad = ['rechazado', 'cancelado'].indexOf(o.status) >= 0;
      return { t: '#' + o.id + ' · ' + R(o.restId).short, s: ok ? 'Por tu enlace · entregado' : bad ? 'Cancelado · no suma' : 'En curso · suma al entregarse', a: ok ? Math.round(o.subtotal * S.promo.pct / 100) : 0, img: R(o.restId).img, x: bad, pend: !ok && !bad };
    }).concat(ex);
    return '<div class="screen has-tabs"><div class="row between"><h1 class="t-title">Mis ganancias</h1><span class="badge amber">' + (ONLINE ? 'Comisión de ejemplo' : 'Montos de ejemplo') + '</span></div>' +
      '<div class="earn mt16"><div class="small" style="opacity:.85">Este mes · ' + month + '</div><div class="big">' + fmt(total) + '</div>' +
      '<div class="bars">' + weeks.map(function (w, i) { return '<div class="' + (i === 3 ? 'cur' : '') + '" style="height:' + Math.round(w / max * 100) + '%"></div>'; }).join('') + '</div>' +
      '<div class="bars-l"><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Esta semana</span></div></div>' +
      '<div class="stats mt12" style="grid-template-columns:1fr 1fr"><div class="stat"><div class="xs muted">Clientes traídos</div><div class="v">' + (X.cl + new Set(real.map(function (o) { return o.customer.phone; })).size) + '</div></div><div class="stat"><div class="xs muted">Pedidos entregados</div><div class="v">' + (X.del + del.length) + '</div></div></div>' +
      (rows.length ? '' : '<div class="empty">Aún no hay pedidos con tu enlace. Compártelo por WhatsApp o imprime tu QR.</div>') +
      '<div class="card mt12" style="padding:4px 14px' + (rows.length ? '' : ';display:none') + '">' + rows.map(function (x) {
        return '<div class="list-row" style="opacity:' + (x.x ? .5 : 1) + '">' + photo(x.img, 'thumb s44') + '<div class="grow"><div class="b">' + x.t + '</div><div class="small muted">' + x.s + '</div></div><div class="b" style="color:' + (x.a ? 'var(--green)' : 'var(--muted)') + '">' + (x.a ? '+' + fmt(x.a) : x.pend ? '…' : '$0') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="small muted mt12">Solo cuentan pedidos entregados de clientes que llegaron con tu enlace. Los cancelados no suman.</div>' +
      '<div class="card mt12 row" style="background:var(--soft)"><div class="grow"><div class="b" style="color:var(--soft-t)">Próximo pago a Nequi</div><div class="small" style="color:var(--soft-t)">1 de ' + (function () { var d = new Date(); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('es-CO', { month: 'long' }); })() + (S.user.phone ? ' · ' + phoneFmt(S.user.phone) : '') + '</div></div><div class="num" style="font-size:22px">' + fmt(X.pay + realSum) + '</div></div></div>' + tabs('promo', 'ganancias');
  }

  // ---------- Router ----------
  function parse() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?'), query = {};
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    return { path: h, parts: h.split('/').filter(Boolean), query: query };
  }
  function view(rt) {
    var p = rt.parts;
    switch (p[0]) {
      case undefined: return scrStart();
      case 'inicio': return scrInicio();
      case 'buscar': return scrBuscar();
      case 'pedidos': return scrPedidos();
      case 'perfil': return scrPerfil();
      case 'r': return scrMenu(p[1], rt.query);
      case 'negocio': return scrNegocio(p[1]);
      case 'sugerir': return scrSugerir(rt.query);
      case 'pueblo': return scrPueblo(false);
      case 'confirmar': return scrConfirmar();
      case 'pedido': return scrPedido(p[1]);
      case 'calificar': return scrCalificar(p[1]);
      case 'entrega': return ONLINE ? scrEntrega(p[1]) : scrStart();
      case 'rest':
        if (p[1] === 'registro') return scrRestRegistro();
        if (ONLINE && p[1] === 'clave') return scrRestClave();
        if (ONLINE && p[1] === 'login') return CLOUD.restUid() ? (setTimeout(function () { go('/rest'); }, 0), scrLoading()) : scrRestLogin();
        if (ONLINE && p[1] === 'bolsa' && !S.restId) return scrBolsa(false);
        if (ONLINE && !ui.synced && !S.restId) return scrLoading('Panel del restaurante');
        if (ONLINE && !CLOUD.restUid() && ui.synced) return scrRestLogin();
        if (ONLINE && !S.restId) return scrRestRegistro();
        if (ONLINE && p[1] === 'menu') return scrRestMenu();
        if (p[1] === 'enviar') return scrEnviar(p[2]);
        if (p[1] === 'mes') return scrRestMes(rt.query);
        if (p[1] === 'domiciliarios') return scrMisRiders();
        if (p[1] === 'bolsa') return scrBolsa(true);
        return scrRest(rt.query);
      case 'dom': return p[1] === 'perfil' ? scrDomPerfil() : scrDom();
      case 'wa': return scrWa(p[1]);
      case 'legal': return scrLegal(p[1]);
      case 'admin': return ONLINE ? scrAdmin(p[1]) : scrStart();
      case 'cuenta': return loginOn() ? scrCuenta(rt.query) : scrPerfil();
      case 'promo': return p[1] === 'ganancias' ? scrGanancias() : scrPromo();
      default: return scrStart();
    }
  }
  function render() {
    ui.pendingRender = false;
    var rt = parse();
    var key = location.hash;
    var same = key === ui.lastRoute;
    var y = window.scrollY;
    var active = document.activeElement && document.activeElement.id;
    document.getElementById('app').innerHTML = view(rt);
    if (same) window.scrollTo(0, y); else { window.scrollTo(0, 0); sheet(null); }
    ui.lastRoute = key;
    if (ONLINE) keepAwake(rt.parts[0] === 'rest' && !!S.restId);
    if (document.getElementById('secTabs')) { secMark.last = -1; window.dispatchEvent(new Event('scroll')); }
    if (rt.parts[0] === 'promo' && !rt.parts[1]) drawQR();
    if (rt.parts[0] === 'wa') { setTimeout(function () { window.scrollTo(0, document.body.scrollHeight); }, 30); }
    if (rt.parts[0] === 'buscar' && !same) { var q = document.getElementById('q'); if (q && !('ontouchstart' in window)) q.focus(); }
    if (same && active) { var el = document.getElementById(active); if (el && el.tagName === 'INPUT' && el.type !== 'file') { el.focus(); try { var v = el.value.length; el.setSelectionRange(v, v); } catch (e) {} } }
  }

  // ---------- QR ----------
  function makeQR(text) {
    var q = qrcode(0, 'H'); q.addData(text); q.make(); return q;
  }
  function drawQR() {
    var c = document.getElementById('qr'); if (!c || typeof qrcode === 'undefined') return;
    var q = makeQR(promoLink(S.promo.restId)), n = q.getModuleCount();
    var scale = 4, size = n * scale, pad = 0;
    c.width = size; c.height = size;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, size, size); x.fillStyle = '#1A1A1A';
    for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(pad + cc * scale, pad + r * scale, scale, scale);
  }
  function downloadQR() {
    var pr = R(S.promo.restId), q = makeQR(promoLink(pr.id)), n = q.getModuleCount();
    var W = 1000, H = 1300, cell = Math.floor(760 / n), qs = cell * n, ox = (W - qs) / 2, oy = 230;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#FAF8F5'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#FF6B2C'; x.fillRect(0, 0, W, 16);
    x.fillStyle = '#1A1A1A'; x.textAlign = 'center';
    x.font = '700 64px Poppins, sans-serif'; x.fillText('Pide aquí', W / 2, 110);
    x.font = '600 40px Inter, sans-serif'; x.fillStyle = '#6B6B6B'; x.fillText(pr.name, W / 2, 170);
    x.fillStyle = '#fff'; x.fillRect(ox - 30, oy - 30, qs + 60, qs + 60);
    x.fillStyle = '#1A1A1A';
    for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(ox + cc * cell, oy + r * cell, cell, cell);
    var img = new Image();
    img.onload = function () {
      var L = 150; x.fillStyle = '#fff'; x.fillRect(W / 2 - L / 2 - 10, oy + qs / 2 - L / 2 - 10, L + 20, L + 20);
      x.drawImage(img, W / 2 - L / 2, oy + qs / 2 - L / 2, L, L); finish();
    };
    img.onerror = finish;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(logo(48, 'icon').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    function finish() {
      x.fillStyle = '#1F4D3A'; x.font = '700 44px Poppins, sans-serif'; x.fillText('Pido y Ido · Villanueva', W / 2, oy + qs + 110);
      x.fillStyle = '#6B6B6B'; x.font = '500 30px Inter, sans-serif'; x.fillText('Escanea con la cámara del celular', W / 2, oy + qs + 160);
      var a = document.createElement('a'); a.download = 'qr-' + pr.id + '.png'; a.href = c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
      toast('QR descargado');
    }
  }

  // ---------- Actions ----------
  function setPath(path, val) {
    var parts = path.split('.'), obj = parts[0] === 'ui' ? ui : S, i = parts[0] === 'ui' ? 1 : 0;
    for (; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = val;
    if (path.indexOf('ui.') !== 0) save();
  }
  function addToCart(restId, dishId) {
    if (S.cart.restId && S.cart.restId !== restId && cartCount() > 0) {
      sheet('<div class="t-h2">¿Empezar un carrito nuevo?</div><div class="muted mt8">Tu carrito tiene productos de ' + R(S.cart.restId).name + '. Solo puedes pedir de un restaurante a la vez.</div>' +
        '<button class="btn btn-primary btn-block mt16" data-a="newCart" data-r="' + restId + '" data-d="' + dishId + '">Sí, empezar de nuevo</button><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Mantener mi carrito</button>');
      return;
    }
    if (S.cart.restId !== restId) S.cart = { restId: restId, items: {}, mode: S.cart.restId === restId ? S.cart.mode : 'dom' };
    S.cart.items[dishId] = (S.cart.items[dishId] || 0) + 1;
    save(); render();
  }
  var A = {
    closeSheet: function () { sheet(null); },
    cat: function (el) { ui.cat = el.dataset.v || null; if (ui.cat === ui._lastCat) ui.cat = null; ui._lastCat = ui.cat; render(); },
    qset: function (el) { ui.q = el.dataset.v; render(); },
    add: function (el) { addToCart(el.dataset.r, el.dataset.d); },
    dishView: function (el) { var r = R(el.dataset.r), d = r && r.dishes.filter(function (x) { return x.id === el.dataset.d; })[0]; if (d) sheet(dishSheet(r, d)); },
    dishSheetAdd: function (el) {
      var r = R(el.dataset.r), d = r.dishes.filter(function (x) { return x.id === el.dataset.d; })[0], before = dishQty(r, d);
      addToCart(r.id, d.id);
      if (dishQty(r, d) > before) { sheet(null); toast(d.name + ' en tu carrito'); }
    },
    dishSheetDec: function (el) { A.dec(el); var r = R(el.dataset.r), d = r.dishes.filter(function (x) { return x.id === el.dataset.d; })[0]; if (d) sheet(dishSheet(r, d)); },
    secGo: function (el) {
      var t = document.getElementById('sec' + el.dataset.v), bar = document.getElementById('secTabs');
      if (!t) return;
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0) - 4, behavior: 'smooth' });
      secMark(+el.dataset.v);
    },
    dec: function (el) { var d = el.dataset.d; S.cart.items[d] = Math.max(0, (S.cart.items[d] || 0) - 1); if (!S.cart.items[d]) delete S.cart.items[d]; if (!cartCount()) S.cart.restId = null; save(); render(); },
    newCart: function (el) { S.cart = { restId: el.dataset.r, items: {}, mode: 'dom' }; sheet(null); addToCart(el.dataset.r, el.dataset.d); },
    mode: function (el) { if (S.cart.restId !== el.dataset.r) { if (cartCount()) { toast('Primero termina o vacía tu carrito actual'); return; } S.cart = { restId: el.dataset.r, items: {}, mode: el.dataset.v }; } else S.cart.mode = el.dataset.v; save(); render(); },
    fav: function (el) {
      var id = el.dataset.id; if (!id) return;
      S.favs = S.favs || {};
      if (S.favs[id]) { delete S.favs[id]; toast('Quitado de tus favoritos'); } else { S.favs[id] = now(); toast('Guardado en tus favoritos. Lo ves en Inicio.'); }
      save(); render();
    },
    pay: function (el) { S.co.pay = el.dataset.v; save(); render(); },
    waOk: function () { S.user.waOk = !S.user.waOk; save(); render(); },
    legalOk: function () { S.legalOk = Date.now(); ui.legalErr = false; save(); render(); },
    regLegal: function () { ui.reg = ui.reg || {}; ui.reg.legal = !ui.reg.legal; if (ui.regErr) ui.regErr.legal = 0; render(); },
    notifOn: function () {
      try { Notification.requestPermission().then(function (p) { render(); toast(p === 'granted' ? 'Listo: te avisamos cada pedido nuevo' : 'Sin avisos. Puedes activarlos en los ajustes del navegador.'); }); } catch (e) {}
    },
    reviewInfo: function () {
      var sup = supportWa();
      sheet('<div class="t-h3">Los clientes todavía no ven tu negocio</div><div class="small muted mt8">Pido y Ido revisa los negocios nuevos, o ocultó el tuyo por quejas o datos que no coinciden. Escríbenos y lo vemos contigo. Mientras tanto puedes seguir con tu menú, fotos y mapa.</div>' +
        (sup ? '<a class="btn btn-green btn-block mt16" target="_blank" rel="noopener" href="' + waLink(sup, 'Hola, mi negocio ' + (R(S.restId) || {}).name + ' todavía no aparece en Pido y Ido.') + '">' + ic('msg', 18) + ' Escribirle a Pido y Ido</a>' : '') +
        '<button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Entendido</button>');
    },
    recoveryNew: function () {
      if (!ONLINE || ui.busy) return;
      CLOUD.newRecoveryCode().then(function (code) {
        S.hasRecovery = true;
        sheet('<div class="t-h3">Tu código para recuperar la clave</div><div class="small muted mt8">Guárdalo en un lugar seguro: anótalo o tómale una foto. Lo vas a necesitar si olvidas tu clave. No se lo des a nadie.</div>' +
          '<div class="num center mt16" style="font-size:30px;letter-spacing:4px;padding:14px;border-radius:14px;background:var(--soft)">' + esc(code) + '</div>' +
          '<div class="xs muted center mt8">Solo te lo mostramos esta vez. Si lo pierdes, crea uno nuevo desde tu panel.</div>' +
          '<button class="btn btn-primary btn-block mt16" data-a="closeSheet">Ya lo guardé</button>');
        render();
      }, function (e) { toast(/not_allowed/.test(String(e && e.message)) ? 'Inicia sesión con tu negocio.' : errTxt(e)); });
    },
    adminFind: function () { render(); },
    adminTab: function (el) { if (ui.admin) { ui.admin.tab = el.dataset.v; ui.admin.cli = null; } render(); },
    adminCli: function (el) { if (ui.admin) { ui.admin.cli = el.dataset.v; ui.admin.det = null; } render(); window.scrollTo(0, 0); },
    adminCliBack: function () { if (ui.admin) { ui.admin.cli = null; ui.admin.det = null; ui.admin.cl = null; } render(); },
    adminNeed: function () {
      var A2 = ui.admin; if (!A2 || ui.busy) return;
      ui.busy = true;
      CLOUD.adminSetNeedPhone(A2.key, !A2.need).then(function () { ui.busy = false; A2.need = !A2.need; render(); toast(A2.need ? 'Ahora se pide número confirmado para pedir' : 'Ya no se pide número confirmado'); },
        function (e) { ui.busy = false; toast(errTxt(e)); });
    },
    adminBlock: function () {
      var A2 = ui.admin, d = A2 && A2.det; if (!d || ui.busy) return;
      var on = !d.bloqueo, why = '';
      if (on) { why = window.prompt('¿Por qué lo bloqueas? (lo ves solo tú)', 'No pagó'); if (why === null) return; }
      ui.busy = true;
      CLOUD.adminBlock(A2.key, d.phone, on, why).then(function () { ui.busy = false; d.bloqueo = on ? { reason: why, at: new Date().toISOString() } : null; A2.cl = null; render(); toast(on ? 'Número bloqueado' : 'Número desbloqueado'); },
        function (e) { ui.busy = false; toast(errTxt(e)); });
    },
    cuentaEnviar: function () {
      var f = ui.cuenta; if (!f || ui.busy) return;
      var ph = String(f.phone || '').replace(/\D/g, '').slice(-10);
      if (ph.length !== 10 || ph[0] !== '3') { f.msg = 'Escribe tu celular de 10 números (empieza por 3).'; render(); return; }
      if (f.sentAt && now() - f.sentAt < 60000 && f.phone === f.sentTo) { f.step = 2; render(); return; }
      f.phone = ph; f.msg = ''; ui.busy = true; render();
      CLOUD.sendCode(ph).then(function () { ui.busy = false; f.step = 2; f.code = ''; f.sentAt = now(); f.sentTo = ph; render(); setTimeout(function () { var c = document.getElementById('cu2'); if (c) c.focus(); }, 50); },
        function (e) { ui.busy = false; f.msg = codeErr(e); render(); });
    },
    cuentaCambiar: function () { if (ui.cuenta) { ui.cuenta.step = 1; ui.cuenta.msg = ''; } render(); },
    cuentaVerificar: function (el) {
      var f = ui.cuenta; if (!f || ui.busy) return;
      var code = String(f.code || '').replace(/\D/g, '');
      if (code.length !== 6) { f.msg = 'El código tiene 6 números.'; render(); return; }
      var next = (el && el.dataset && el.dataset.next) || (parse().query.next) || '/perfil';
      f.msg = ''; ui.busy = true; render();
      CLOUD.verifyCode(f.phone, code).then(function (moved) {
        ui.busy = false; S.custPhone = f.phone; S.user.phone = f.phone; ui.cuenta = null; save();
        return sync(true).then(function () { go(next); toast(moved ? '¡Listo! Tu número quedó confirmado y tus pedidos quedaron guardados.' : '¡Listo! Tu número quedó confirmado.'); });
      }, function (e) { ui.busy = false; f.msg = codeErr(e); render(); });
    },
    cuentaSalir: function () {
      if (ui.busy) return;
      ui.busy = true;
      CLOUD.custLogout().then(function () { ui.busy = false; S.custPhone = ''; S.orders = S.orders.filter(function (o) { return !o.mine; }); S.reward = null; save(); return sync(true); }).then(function () { go('/perfil'); toast('Saliste de tu cuenta'); });
    },
    adminAuto: function () {
      var A2 = ui.admin; if (!A2 || ui.busy) return;
      ui.busy = true;
      CLOUD.adminSetAuto(A2.key, !A2.auto).then(function () { ui.busy = false; A2.auto = !A2.auto; render(); toast(A2.auto ? 'Los negocios nuevos salen de una vez' : 'Los negocios nuevos esperan tu aprobación'); },
        function (e) { ui.busy = false; toast(errTxt(e)); });
    },
    adminToggle: function (el) {
      var A2 = ui.admin, r = A2 && A2.list && A2.list.filter(function (x) { return x.id === el.dataset.v; })[0];
      if (!r || ui.busy) return;
      ui.busy = true;
      CLOUD.adminSet(A2.key, r.id, !r.visible).then(function () { ui.busy = false; r.visible = !r.visible; render(); toast(r.visible ? r.name + ' se ve otra vez' : r.name + ' quedó oculto'); },
        function (e) { ui.busy = false; toast(errTxt(e)); });
    },
    claveDo: function () {
      var f = ui.clave || {}, ph = String(f.phone || '').replace(/\D/g, '');
      if (ph.length !== 10) { ui.claveMsg = 'Escribe el WhatsApp del negocio (10 números).'; render(); return; }
      if (String(f.code || '').trim().length < 6) { ui.claveMsg = 'Escribe tu código de recuperación.'; render(); return; }
      if (String(f.pass || '').length < 6) { ui.claveMsg = 'La clave nueva debe tener mínimo 6 letras o números.'; render(); return; }
      if (ui.busy) return;
      ui.busy = true; ui.claveMsg = ''; render();
      CLOUD.resetClave(ph, f.code, f.pass).then(function (r) {
        ui.busy = false;
        var msg = { incorrecto: 'Ese código no es correcto.', bloqueado: 'Demasiados intentos. Escríbele a Pido y Ido para que te ayudemos.', sin_codigo: 'Este negocio no tiene código guardado. Escríbele a Pido y Ido.', no_existe: 'No hay ningún negocio con ese número.', clave_corta: 'La clave nueva debe tener mínimo 6 letras o números.' }[r];
        if (msg) { ui.claveMsg = msg; render(); return; }
        ui.login = { phone: f.phone, pass: '' }; ui.clave = null; go('/rest/login'); toast('Listo. Entra con tu clave nueva.');
      }, function (e) { ui.busy = false; ui.claveMsg = errTxt(e); render(); });
    },
    markPaid: function (el) {
      var o = order(el.dataset.id); if (!o || o.paidClaimAt) return;
      o.paidClaimAt = now(); S.payOut = null; save(); sheet(null); render();
      if (ONLINE) push(CLOUD.markPaid(o.dbId));
      celebrate(o, 'paid');
    },
    copyPay: function (el) { copyTxt(el.dataset.v, 'Número copiado: ' + el.dataset.v); },
    // No existe un enlace público de Nequi/Daviplata que abra el pago con número y valor, ni que regrese solo a la app.
    // Copiamos el número, abrimos la app (Android) y al volver preguntamos si ya transfirió.
    payApp: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      var ct = contactFor(o), num = payDigits(ct), nq = o.pay === 'nequi';
      S.payOut = { id: o.id, at: now() }; save();
      copyTxt(num, 'Número copiado. Pégalo en ' + (nq ? 'Nequi' : 'Daviplata') + ' y transfiere ' + fmt(o.total));
      var pkg = nq ? 'com.nequi.MobileApp' : 'com.davivienda.daviplataapp';
      if (/android/i.test(navigator.userAgent)) setTimeout(function () { location.href = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=' + pkg + ';end'; }, 350);
      else sheet('<div class="t-h2">Abre ' + (nq ? 'Nequi' : 'Daviplata') + '</div><div class="muted mt8">Ya copiamos el número <b>' + esc(ct.nequi) + '</b>. Abre la app, toca <b>Enviar</b>, pega el número y transfiere <b>' + fmt(o.total) + '</b>.</div><div class="muted mt8">Cuando vuelvas aquí te preguntamos si ya pagaste.</div><button class="btn btn-primary btn-block mt16" data-a="closeSheet">Entendido</button>');
    },
    payNotYet: function () { S.payOut = null; save(); sheet(null); },
    cash: function (el) { S.co.cash = el.dataset.v; save(); render(); },
    coAdd: function (el) { S.cart.items[el.dataset.d] = (S.cart.items[el.dataset.d] || 0) + 1; save(); render(); },
    coDec: function (el) {
      var d = el.dataset.d, n = (S.cart.items[d] || 0) - 1;
      if (n > 0) { S.cart.items[d] = n; save(); render(); return; }
      if (cartLines().length === 1) { sheet('<div class="t-h2">¿Quitar el último plato?</div><div class="muted mt8">Tu carrito queda vacío.</div><button class="btn btn-primary btn-block mt16" data-a="coDecOk" data-d="' + esc(d) + '">Sí, quitarlo</button><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">No, dejarlo</button>'); return; }
      delete S.cart.items[d]; save(); render(); toast('Quitado del pedido');
    },
    coDecOk: function (el) { delete S.cart.items[el.dataset.d]; sheet(null); A.clearCart(); },
    billAdd: function (el) { var b = S.co.bills = S.co.bills || {}; b[el.dataset.v] = Math.min(9, (b[el.dataset.v] || 0) + 1); S.co.cash = 'bills'; save(); render(); },
    billDec: function (el) { var b = S.co.bills = S.co.bills || {}; b[el.dataset.v] = Math.max(0, (b[el.dataset.v] || 0) - 1); if (!b[el.dataset.v]) delete b[el.dataset.v]; save(); render(); },
    whenNow: function () { S.co.later = false; save(); render(); },
    whenLater: function () { S.co.later = true; save(); render(); },
    whenDay: function (el) { S.co.day = +el.dataset.v; S.co.when = null; save(); render(); },
    whenPick: function (el) { S.co.when = +el.dataset.v; S.co.later = true; save(); render(); },
    clearCart: function () { ui.again = null; S.cart = { restId: null, items: {}, mode: 'dom' }; save(); go('/inicio'); },
    geo: function () {
      if (ONLINE) {
        var r = R(S.cart.restId);
        openMap({ title: '¿Dónde está tu casa?', sub: 'Mueve el mapa hasta que el pin quede encima de tu casa.', start: S.co.geo || (hasLoc(r) ? r : null),
          zone: hasLoc(r) ? r : null, onPick: function (g) { S.co.geo = g; save(); render(); toast('Casa marcada'); } });
        return;
      }
      if (!navigator.geolocation) { toast('Tu celular no permite ubicación'); return; }
      toast('Buscando tu ubicación…');
      navigator.geolocation.getCurrentPosition(function (p) { S.co.geo = { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }; save(); render(); toast('Ubicación guardada'); },
        function () { toast('No pudimos ver tu ubicación. Igual llega con la dirección escrita.'); }, { enableHighAccuracy: true, timeout: 10000 });
    },
    placeOrder: function () {
      var lines = cartLines(), shop = cartShop();
      if (shop && !wishHas()) { toast('Escribe lo que necesitas'); go('/r/' + S.cart.restId); return; }
      if (!lines.length && !shop) return;
      if (!S.legalOk) { ui.legalErr = true; render(); toast('Marca la casilla para autorizar el uso de tus datos'); return; }
      var r = R(S.cart.restId);
      var addr = (S.user.address || '').trim(), phone = fullPhone(S.user.phone, S.user.cc);
      if (S.cart.mode === 'dom' && addr.length < 6) { toast('Escribe tu dirección para que te encuentren'); var a = document.getElementById('addr'); if (a) { a.classList.add('err'); a.focus(); } return; }
      if (ONLINE && S.cart.mode === 'dom' && !S.co.geo) { toast('Marca tu casa en el mapa'); A.geo(); return; }
      if (ONLINE && S.cart.mode === 'dom' && tooFar(r, S.co.geo)) { toast('Estás fuera de la zona de entrega. Elige Recoger.'); return; }
      var when = wantsLater(r) ? S.co.when : null;
      if (wantsLater(r) && (!when || when < now() + 45 * 60000)) { S.co.when = null; render(); toast('Elige a qué hora lo quieres'); return; }
      if (!(S.user.name || '').trim()) { toast('Escribe tu nombre'); return; }
      if (loginOn() && S.custPhone) phone = S.custPhone;
      if (!phone) { toast((S.user.cc || '57') === '57' ? 'Escribe tu celular (10 números)' : 'Revisa tu número de celular'); var pe = document.getElementById('ph'); if (pe) { pe.classList.add('err'); pe.focus(); } return; }
      if (needLogin() && phone.length !== 10) { toast('Por ahora confirmamos solo celulares de Colombia'); return; }
      if (needLogin()) { ui.cuenta = { phone: phone.slice(-10), code: '', step: 1, msg: '' }; save(); go('/cuenta?next=/confirmar'); toast('Confirma tu número una vez y listo'); return; }
      var sub = cartSubtotal(), fee = cartFee(), disc = cartDiscount(), total = sub + fee - disc;
      var bills = S.co.pay === 'ef' && S.co.cash === 'bills' ? billsSum() : 0;
      if (bills && !shop && bills < total) { toast('Con esos billetes te faltan ' + fmt(total - bills)); return; }
      var o = {
        id: String(S.nextId++).padStart(4, '0'), restId: r.id, mine: true,
        customer: { name: S.user.name.trim(), phone: phone, address: S.cart.mode === 'dom' ? addr : 'Recoge en el local', wa: !!S.user.waOk && waOn() },
        items: lines.map(function (l) { return { id: l.id, name: l.name, price: l.price, qty: l.qty }; }),
        subtotal: sub, fee: fee, total: total, discount: disc, mode: S.cart.mode, note: S.co.note, pay: S.co.pay,
        cashGiven: S.co.pay === 'ef' ? (bills || (shop ? 0 : total)) : 0, cashBills: bills ? billsTxt(S.co.bills) : '',
        pin: randPin(), status: 'recibido', createdAt: now(), geo: S.co.geo, scheduledFor: when,
        ref: S.ref && S.ref.restId === r.id ? { slug: S.ref.slug } : null
      };
      if (shop) { o.wish = String(S.cart.wish || '').trim().slice(0, 1000) || '(Ver la foto)'; o.wishImg = S.cart.wishImg || ''; }
      var finish = function () {
        S.orders.unshift(o); ui.again = null;
        S.cart = { restId: null, items: {}, mode: 'dom' }; S.co.note = ''; S.co.cash = 'exact'; S.co.bills = {}; S.co.later = false; S.co.when = null; S.co.day = 0; if (!ONLINE) S.co.geo = null;
        save(); go('/pedido/' + o.id); celebrate(o, 'placed');
      };
      if (!ONLINE) return finish();
      if (ui.busy) return;
      ui.busy = true; render();
      CLOUD.placeOrder({ rest_id: r.id, items: o.items.map(function (i) { return { id: i.id, qty: i.qty }; }), mode: o.mode, note: o.note, pay: o.pay, cash_given: o.cashGiven,
        customer: o.customer, geo: o.geo, ref_slug: o.ref ? o.ref.slug : null, wish: shop ? o.wish : undefined, wish_img: shop ? o.wishImg : undefined, scheduled_for: when ? new Date(when).toISOString() : undefined })
        .then(function (res) { ui.busy = false; o.dbId = res.id; o.id = String(res.id).padStart(4, '0'); o.pin = res.pin; if (res.total != null) { o.total = res.total; o.discount = res.discount || 0; } else { o.total = sub + fee; o.discount = 0; } finish(); sync(); },
          function (e) { ui.busy = false; render(); toast(errTxt(e)); sync(); });
    },
    cancelOrder: function (el) { var o = order(el.dataset.id); if (o && (o.status === 'recibido' || (o.wish && o.status === 'preparando'))) { o.status = 'cancelado'; save(); go('/pedidos'); toast('Pedido cancelado'); if (ONLINE) push(CLOUD.cancelOrder(o.dbId)); } },
    reorder: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      var r = R(o.restId), c = againCheck(o);
      // Mismos datos de la vez pasada: dirección, pin en el mapa, forma de pago y nota.
      if (o.mode === 'dom' && o.customer && o.customer.address && o.customer.address !== 'Recoge en el local') S.user.address = o.customer.address;
      if (o.mode === 'dom' && o.geo) S.co.geo = o.geo;
      if (o.pay) S.co.pay = o.pay;
      S.co.note = o.note || ''; S.co.cash = 'exact'; S.co.bills = {}; S.co.later = false; S.co.when = null;
      if (o.wish) { S.cart = { restId: o.restId, items: {}, mode: o.mode || 'dom', wish: o.wish === '(Ver la foto)' ? '' : o.wish, wishImg: '' }; ui.again = { id: o.id, rest: o.restId, shop: true }; save(); go('/r/' + o.restId); return; }
      if (!c.ok.length) { toast('Esos platos ya no están en el menú de ' + r.short); go('/r/' + o.restId); return; }
      S.cart = { restId: o.restId, items: {}, mode: o.mode || 'dom' };
      c.ok.forEach(function (i) { S.cart.items[i.id] = i.qty; });
      ui.again = { id: o.id, rest: o.restId, gone: c.gone, changed: c.changed, at: o.createdAt };
      save(); go('/confirmar');
    },
    star: function (el) { ui.rate.stars = +el.dataset.v; render(); },
    tag: function (el) { ui.rate.tags[el.dataset.v] = !ui.rate.tags[el.dataset.v]; render(); },
    sendRating: function (el) {
      var o = order(el.dataset.id); if (!o || !ui.rate.stars) return;
      o.rating = ui.rate.stars; o.tags = Object.keys(ui.rate.tags).filter(function (k) { return ui.rate.tags[k]; });
      var r = R(o.restId), cur = restRating(r);
      S.ratings[r.id] = { rating: (cur.rating * cur.count + o.rating) / (cur.count + 1), count: cur.count + 1 };
      if (ONLINE) push(CLOUD.rateOrder(o.dbId, o.rating, o.tags));
      ui.rate = null; save(); go('/inicio'); toast('¡Gracias por calificar!');
    },
    editAddress: function () {
      sheet('<div class="t-h2">¿Dónde te lo llevamos?</div>' +
        '<button class="town-row mt8" data-a="goPueblo" style="border-bottom:0"><span class="town-ic live">' + ic('pin', 20, { sw: 2.2 }) + '</span><span class="grow"><span class="xs muted" style="display:block">Pueblo</span><span class="b">' + esc(myTown()) + '</span></span><span class="link b">Cambiar</span></button>' +
        '<label class="label mt8" for="addrS">Dirección en ' + esc(myTown()) + '</label><textarea class="input" id="addrS" rows="3" placeholder="Calle, número y barrio">' + esc(S.user.address) + '</textarea><button class="btn btn-primary btn-block mt12" data-a="saveAddrSheet">Guardar dirección</button>');
    },
    saveAddrSheet: function () { var v = document.getElementById('addrS').value.trim(); if (v) { S.user.address = v; save(); } sheet(null); render(); },
    saveProfile: function () { save(); render(); toast('Datos guardados'); },
    resetAsk: function () {
      sheet('<div class="t-h2">¿Reiniciar la demo?</div><div class="muted mt8">Se borran los pedidos, domiciliarios y cambios que hiciste en este celular, y vuelven los datos de ejemplo.</div><button class="btn btn-primary btn-block mt16" data-a="reset">Sí, reiniciar</button><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Cancelar</button>');
    },
    reset: function () { S = seed(); ui.rate = null; ui.signup = null; ui.choose = {}; save(); sheet(null); go('/'); toast('Demo reiniciada'); },
    rolePick: function (el) { ui.rolePick = el.dataset.v; render(); },
    roleGo: function () {
      var r = roleById(ui.rolePick || S.role || 'cliente'), firstTime = !(S.seen || {})[r.id];
      S.role = r.id; S.seen = S.seen || {}; S.seen[r.id] = true; ui.rolePick = null; save();
      go(firstTime && r.first && !(r.id === 'rider' && S.myProfile) ? r.first : r.home);
    },
    login: function () { toast('En la demo no necesitas cuenta. Elige cómo quieres usar la app.'); },
    regDo: function () {
      if (ONLINE) return regLive();
      var f = ui.reg || {};
      if (f.name && f.name.trim()) toast('¡Bienvenido, ' + f.name.trim() + '! Así se ve tu panel.');
      ui.reg = null; go('/rest?r=llanero');
    },
    install: function () { if (ui.installEvt) { ui.installEvt.prompt(); ui.installEvt.userChoice.then(function () { ui.installEvt = null; render(); }); } },
    // restaurant
    pickRest: function () {
      if (ONLINE) {
        sheet('<div class="t-h2">' + esc(R(S.restId).name) + '</div><div class="small muted mt4">Entraste con el WhatsApp ' + phoneFmt(R(S.restId).phone) + '.</div>' +
          '<a class="btn btn-outline btn-block mt16" href="#/rest/menu">' + (isShop(R(S.restId)) ? 'Editar mi tienda' : 'Editar menú y datos') + '</a><button class="btn btn-ghost btn-block mt8" data-a="restLogout">Cerrar sesión</button>');
        return;
      }
      sheet('<div class="t-h2">¿Qué negocio eres?</div><div class="small muted mt4">En la demo puedes ver el panel de cualquiera.</div><div class="mt12">' + RESTAURANTS.map(function (r) {
        return '<button class="radio-row' + (S.restId === r.id ? ' on' : '') + '" data-a="setRest" data-v="' + r.id + '">' + cover(r, 'thumb s44') + '<span class="grow b">' + r.name + '</span><span class="ring"></span></button>';
      }).join('') + '</div>');
    },
    setRest: function (el) { S.restId = el.dataset.v; save(); sheet(null); render(); },
    toggleOpen: function () {
      if (ONLINE && !S.open[S.restId] && isShop(R(S.restId)) && !hasLoc(R(S.restId))) { toast('Primero marca tu tienda en el mapa'); go('/rest/menu'); return; }
      if (ONLINE && !S.open[S.restId] && !isShop(R(S.restId)) && !R(S.restId).dishes.length) { toast('Primero agrega tu menú'); go('/rest/menu'); return; }
      S.open[S.restId] = !S.open[S.restId]; R(S.restId).open = S.open[S.restId]; save(); render(); toast(S.open[S.restId] ? 'Abierto: ya recibes pedidos' : 'Cerrado: no recibes pedidos');
      if (ONLINE) push(CLOUD.updateRest({ open: S.open[S.restId] }));
    },
    rtab: function (el) { ui.rtab = el.dataset.v; render(); },
    etaPick: function (el) { ui.choose['eta' + el.dataset.id] = +el.dataset.v; render(); },
    accept: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      if (o.wish) return acceptPriced(o);
      o.status = 'preparando'; o.etaMin = o.scheduledFor ? Math.max(5, Math.round((o.scheduledFor - now()) / 60000)) : ui.choose['eta' + o.id] || 30; o.acceptedAt = now(); save();
      if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'preparando', eta_min: o.etaMin, accepted_at: new Date().toISOString() }));
      ui.rtab = 'preparando'; render(); toast(o.scheduledFor ? 'Aceptado para ' + cuandoCo(o.scheduledFor) + ' · queda en Preparando' : 'Aceptado. ' + first(o.customer.name) + ' ya lo ve en su pedido');
    },
    reject: function (el) {
      var id = el.dataset.id, ro = order(id);
      sheet('<div class="t-h2">¿Por qué no puedes aceptarlo?</div><div class="mt12">' + (ro && ro.scheduledFor ? ['No abrimos a esa hora', 'Ya tenemos muchos pedidos a esa hora', 'No llegamos a esa dirección', ro.wish ? 'No tenemos esos productos' : 'Se acabó un producto'] : ro && ro.wish ? ['No tenemos esos productos', 'Estamos muy llenos ahora', 'No llegamos a esa dirección', 'Ya vamos a cerrar'] : ['Estamos muy llenos ahora', 'Se acabó un producto', 'No llegamos a esa dirección', 'Ya vamos a cerrar']).map(function (x) {
        return '<button class="radio-row" data-a="rejectDo" data-id="' + id + '" data-v="' + x + '"><span class="ring"></span><span class="grow">' + x + '</span></button>';
      }).join('') + '</div><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Volver</button>');
    },
    rejectDo: function (el) { var o = order(el.dataset.id); if (!o) return; o.status = 'rechazado'; o.rejectReason = el.dataset.v + '.'; save(); if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'rechazado', reject_reason: o.rejectReason })); sheet(null); render(); toast('Pedido rechazado. Le avisamos al cliente.'); },
    ready: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      // Ya hay quien lo lleve: "yo" sale de una vez; un domiciliario avisado ya viene en camino al local.
      if (o.mode === 'dom' && o.riderId === 'yo') {
        o.status = 'en_camino'; o.sentAt = now(); save();
        if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'en_camino', sent_at: new Date().toISOString() }));
        ui.rtab = 'camino'; render(); toast('En camino. Al entregar, pide el código al cliente.'); return;
      }
      o.status = 'listo'; save();
      if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'listo' }));
      if (o.mode === 'dom' && riderOf(o)) { render(); toast(callName(riderOf(o).name) + ' ya viene por él'); return; }
      if (o.mode === 'dom') go('/rest/enviar/' + o.id); else { render(); toast('Le avisamos que ya puede recogerlo'); }
    },
    pickT: function (el) { ui.choose['t' + el.dataset.id] = +el.dataset.v; render(); },
    goneOut: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      o.status = 'en_camino'; o.sentAt = now(); save();
      if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'en_camino', sent_at: new Date().toISOString() }));
      ui.rtab = 'camino'; render(); toast('En camino');
    },
    payOk: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      var ok = el.dataset.v === '1';
      o.payOk = ok; save(); render(); toast(ok ? 'Pago marcado como recibido' : 'Le avisamos al cliente que no ves el pago');
      if (ONLINE) push(CLOUD.payOk(o.dbId, ok));
    },
    issueAsk: function (el) {
      var id = el.dataset.id; ui.issue = { id: id, kind: null };
      sheet('<div class="t-h2">¿Qué salió mal?</div><div class="small muted mt4">Le avisamos al negocio para que lo arregle contigo.</div><div class="mt12" id="issueList">' + ISSUES.map(function (x) {
        return '<button class="radio-row" data-a="issuePick" data-v="' + x + '"><span class="ring"></span><span class="grow">' + x + '</span></button>';
      }).join('') + '</div><label class="label mt12" for="issueNote">Cuéntanos un poco más (opcional)</label><textarea class="input" id="issueNote" rows="2" maxlength="300" placeholder="Ej.: faltó el jugo de maracuyá"></textarea>' +
        '<div class="err-msg" id="issueErr"></div><button class="btn btn-primary btn-block mt12" data-a="issueSend">Enviar</button><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Cancelar</button>');
    },
    issuePick: function (el) {
      if (!ui.issue) return; ui.issue.kind = el.dataset.v;
      var er = document.getElementById('issueErr'); if (er) er.textContent = '';
      var rows = document.querySelectorAll('#issueList .radio-row'); for (var k = 0; k < rows.length; k++) rows[k].classList.toggle('on', rows[k] === el);
    },
    issueSend: function (el) {
      var q = ui.issue, o = q && order(q.id); if (!o) return;
      if (!q.kind) { document.getElementById('issueErr').textContent = 'Elige qué pasó.'; return; }
      var note = (document.getElementById('issueNote').value || '').trim().slice(0, 300);
      var done = function () { o.issue = q.kind; o.issueNote = note; o.issueAt = now(); ui.issue = null; save(); sheet(null); render(); toast('Listo, le avisamos a ' + R(o.restId).short); };
      if (!ONLINE) { done(); return; }
      el.disabled = true;
      CLOUD.reportIssue(o.dbId, q.kind, note).then(function (res) {
        if (res === 'ok' || res === 'ya') { done(); sync(); return; }
        el.disabled = false; document.getElementById('issueErr').textContent = res === 'tarde' ? 'Ya pasaron más de 24 horas. Escríbele directamente al negocio.' : 'No se pudo enviar.';
      }, function (err) { el.disabled = false; document.getElementById('issueErr').textContent = /report_issue|function/i.test(String(err && err.message)) ? 'Falta un paso en la base de datos (016-reclamo.sql).' : errTxt(err); });
    },
    issueDone: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      o.issueDoneAt = now(); save(); render(); toast('Reclamo marcado como resuelto');
      if (ONLINE) push(CLOUD.issueDone(o.dbId));
    },
    noEntAsk: function (el) {
      var id = el.dataset.id, o = order(id); if (!o) return;
      var rs = (o.pay === 'ef' ? ['El cliente no pagó', 'El cliente no estaba o no contestó'] : ['El pago no llegó', 'El cliente no estaba o no contestó']).concat(['La dirección estaba mal', 'Tuvimos que cancelarlo']);
      sheet('<div class="t-h2">¿Qué pasó con el pedido #' + o.id + '?</div><div class="small muted mt4">Se cierra sin comisión. El cliente ve el motivo.</div><div class="mt12">' + rs.map(function (x) {
        return '<button class="radio-row" data-a="noEntDo" data-id="' + id + '" data-v="' + x + '"><span class="ring"></span><span class="grow">' + x + '</span></button>';
      }).join('') + '</div><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Volver, sí se entregó</button>');
    },
    noEntDo: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      o.status = 'no_entregado'; o.rejectReason = el.dataset.v + '.'; save();
      if (ONLINE) push(CLOUD.notDelivered(o.dbId, o.rejectReason));
      sheet(null); ui.rtab = 'hechos'; render(); toast('Pedido #' + o.id + ' cerrado sin entregar');
    },
    choose: function (el) { ui.choose['r' + el.dataset.id] = el.dataset.v; render(); },
    sendRider: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      var sel = ui.choose['r' + o.id] || 'yo';
      var snap = sel === 'yo' ? null : S.riders[sel];
      var riderRow = snap ? { name: snap.name, phone: snap.phone, vehicle: snap.vehicle || 'Moto' } : null;
      var early = o.status === 'preparando';
      o.riderId = sel; o.rider = riderRow;
      if (early) {
        // Avisar mientras se cocina: sigue en "Preparando", con la hora para recoger.
        o.readyAt = ui.choose['t' + o.id] || now();
        if (ONLINE) push(CLOUD.updateOrder(o.dbId, { rider_id: sel, rider: riderRow, ready_at: new Date(o.readyAt).toISOString() }));
        if (sel === 'yo') { save(); ui.rtab = 'preparando'; go('/rest'); toast('Listo. Cuando esté, toca «Listo, sale ya».'); return; }
      } else {
        o.status = 'en_camino'; o.sentAt = now();
        if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'en_camino', rider_id: sel, rider: riderRow, sent_at: new Date().toISOString() }));
        if (sel === 'yo') { save(); ui.rtab = 'camino'; go('/rest'); toast('En camino. Al entregar, pide el código al cliente.'); return; }
      }
      var rd = S.riders[sel];
      S.chats[o.id] = S.chats[o.id] || [];
      save(); ui.rtab = early ? 'preparando' : 'camino';
      var msg = riderMsg(o);
      sheet('<div class="t-h2">' + (early ? 'Avisa a ' + esc(rd.name) + ': recoge ' + aLasCo(o.readyAt) : 'Pedido listo para ' + esc(rd.name)) + '</div><div class="small muted mt4">Así le llega por WhatsApp:</div>' +
        '<div class="note grey mt12" style="white-space:pre-line;color:var(--text);font-size:13px">' + esc(msg) + '</div>' +
        '<a class="btn btn-green btn-block mt16" target="_blank" rel="noopener" href="' + waLink(rd.phone, msg) + '">' + ic('msg', 18) + ' Enviar por WhatsApp</a>' +
        (ONLINE ? '' : '<a class="btn btn-outline btn-block mt8" href="#/wa/' + o.id + '">Ver como domiciliario (demo)</a>') +
        '<a class="btn btn-ghost btn-block mt8" href="#/rest">Volver al panel</a>' +
        '<div class="xs muted center mt8">' + (ONLINE ? 'Se abre tu WhatsApp con el mensaje listo; solo toca enviar.' : 'Cuando la app esté en marcha, este mensaje se envía solo desde el número de Pido y Ido.') + '</div>');
    },
    pinAsk: function (el) {
      var id = el.dataset.id;
      sheet('<div class="t-h2">Confirmar entrega</div><div class="muted mt8">Pídele al cliente el código de 4 números.</div><input class="input mt12 center num" id="pinIn" inputmode="numeric" maxlength="4" placeholder="• • • •" style="font-size:28px;letter-spacing:12px">' +
        '<div id="pinErr" class="err-msg center"></div><button class="btn btn-primary btn-block mt12" data-a="pinCheck" data-id="' + id + '">Confirmar</button>');
    },
    pinCheck: function (el) {
      var o = order(el.dataset.id), v = (document.getElementById('pinIn').value || '').trim();
      if (!o) return;
      if (ONLINE) {
        el.disabled = true;
        CLOUD.deliver(o.dbId, v, true).then(function (res) {
          el.disabled = false;
          if (res === 'ok' || res === 'ya_entregado') { deliver(o, 'negocio'); sheet(null); ui.rtab = 'hechos'; render(); toast('Pedido #' + o.id + ' entregado'); sync(); return; }
          var e = document.getElementById('pinErr'); if (e) e.textContent = PIN_TXT[res] || 'No se pudo confirmar.';
        }, function (err) { el.disabled = false; toast(errTxt(err)); });
        return;
      }
      if (v !== o.pin) { document.getElementById('pinErr').textContent = 'Código incorrecto. Revisa con el cliente.'; return; }
      deliver(o, 'negocio'); sheet(null); ui.rtab = 'hechos'; render(); toast('Pedido #' + o.id + ' entregado');
    },
    gotIt: function (el) {
      sheet('<div class="t-h2">¿Ya tienes tu pedido?</div><div class="muted mt8">Toca solo si ya lo tienes en la mano. Así ' + esc(R((order(el.dataset.id) || {}).restId).short || 'el negocio') + ' sabe que llegó bien.</div>' +
        '<button class="btn btn-green btn-block mt16" data-a="gotItDo" data-id="' + el.dataset.id + '">' + ic('check', 18) + ' Sí, ya lo recibí</button><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Todavía no</button>');
    },
    gotItDo: function (el) {
      var o = order(el.dataset.id); if (!o || ui.busy) return;
      var done = function () { deliver(o, 'cliente'); save(); sheet(null); go('/calificar/' + o.id); };
      if (!ONLINE) { done(); return; }
      ui.busy = true; el.disabled = true;
      CLOUD.confirmReceived(o.dbId).then(function (res) {
        ui.busy = false;
        if (res === 'ok' || res === 'ya_entregado') { done(); sync(); return; }
        el.disabled = false; toast(res === 'cerrado' ? 'Este pedido todavía no ha salido.' : 'No se pudo confirmar.');
      }, function (err) { ui.busy = false; el.disabled = false; toast(/confirm_received|function/i.test(String(err && err.message)) ? 'Falta un paso en la base de datos (014-entrega.sql).' : errTxt(err)); });
    },
    addRiderForm: function () {
      sheet('<div class="t-h2">Guardar un domiciliario</div><div class="small muted mt4">Alguien de confianza que te hace domicilios. Solo tú ves esta lista.</div>' +
        '<label class="label mt12" for="rn">Nombre</label><input class="input" id="rn" placeholder="Don Jairo" autocomplete="off">' +
        '<label class="label mt12" for="rp">WhatsApp</label><input class="input" id="rp" inputmode="tel" placeholder="312 000 0000">' +
        '<div class="label mt12">Vehículo</div><div class="chips"><button class="chip on" data-a="rv" data-v="Moto">Moto</button><button class="chip" data-a="rv" data-v="Bicicleta">Bicicleta</button><button class="chip" data-a="rv" data-v="A pie">A pie</button></div>' +
        '<div id="rErr" class="err-msg"></div><button class="btn btn-primary btn-block mt16" data-a="addRider">Guardar</button>');
      ui.rv = 'Moto';
    },
    rv: function (el) { ui.rv = el.dataset.v; el.parentNode.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === el); }); },
    addRider: function () {
      var n = document.getElementById('rn').value.trim(), p = document.getElementById('rp').value.replace(/\D/g, '');
      if (p.length === 12 && p.indexOf('57') === 0) p = p.slice(2);
      if (!n) { document.getElementById('rErr').textContent = 'Escribe el nombre.'; return; }
      if (p.length !== 10) { document.getElementById('rErr').textContent = 'El WhatsApp debe tener 10 números (ej.: 312 000 0000).'; return; }
      var keep = function (rd) {
        S.riders[rd.id] = rd;
        (S.myRiders[S.restId] = S.myRiders[S.restId] || []).push(rd.id);
        var rt = parse(); if (rt.parts[1] === 'enviar') ui.choose['r' + rt.parts[2]] = rd.id;
        save(); sheet(null); render(); toast(n + ' guardado en tu lista');
      };
      if (!ONLINE) return keep({ id: 'r' + now().toString(36), name: n, phone: p, vehicle: ui.rv || 'Moto', barrio: '' });
      CLOUD.addMyRider({ name: n, phone: p, vehicle: ui.rv || 'Moto' }).then(keep, function (e) { var x = document.getElementById('rErr'); if (x) x.textContent = errTxt(e); });
    },
    removeRider: function (el) {
      var id = el.dataset.v, rd = S.riders[id], l = S.myRiders[S.restId] || [];
      S.myRiders[S.restId] = l.filter(function (x) { return x !== id; }); save(); render(); toast('Quitado de tu lista');
      if (ONLINE) push(CLOUD.unlinkRider(id, !!(rd && !rd.board && rd.owner === CLOUD.restUid())));
    },
    saveRider: function (el) {
      var l = S.myRiders[S.restId] = S.myRiders[S.restId] || [], id = el.dataset.v, i = l.indexOf(id);
      if (i >= 0) { l.splice(i, 1); toast('Quitado de tu lista'); } else { l.push(id); toast('Guardado en Mis domiciliarios'); }
      if (ONLINE) push(i >= 0 ? CLOUD.unlinkRider(id, false) : CLOUD.linkRider(id));
      save(); render();
    },
    bf: function (el) { ui.bf[el.dataset.v] = !ui.bf[el.dataset.v]; render(); },
    // rider
    veh: function (el) { ui.signup.vehicle = el.dataset.v; render(); },
    hrs: function (el) { var h = ui.signup.hours, i = h.indexOf(el.dataset.v); if (i >= 0) h.splice(i, 1); else h.push(el.dataset.v); render(); },
    publish: function () {
      var f = ui.signup, err = {}, ph = String(f.phone || '').replace(/\D/g, '');
      if (!f.name.trim()) err.name = 'Escribe tu nombre.';
      if (ph.length !== 10) err.phone = err.phone || 'El WhatsApp debe tener 10 números.';
      if (!f.barrio.trim()) err.barrio = 'Escribe tu barrio.';
      if (!f.hours.length) err.hours = 'Elige al menos un horario.';
      ui.signupErr = err;
      if (Object.keys(err).length) { render(); toast('Revisa los datos marcados'); return; }
      var prof = { name: f.name.trim(), phone: ph, barrio: f.barrio.trim(), vehicle: f.vehicle, hours: f.hours.slice(), docs: [].concat(f.lic ? ['Licencia'] : [], f.soat ? ['SOAT'] : []), board: true };
      var keep = function (rd) {
        S.riders[rd.id] = rd; S.myProfile = rd.id; ui.signup = null; ui.editProfile = false; ui.signupErr = null;
        save(); render(); toast('¡Tu perfil ya está en la bolsa!');
      };
      if (!ONLINE) { prof.id = S.myProfile || ('me' + now().toString(36)); return keep(prof); }
      if (ui.busy) return;
      ui.busy = true;
      CLOUD.saveProfile(S.myProfile, prof).then(function (rd) { ui.busy = false; keep(rd); }, function (e) { ui.busy = false; toast(errTxt(e)); });
    },
    editRiderProfile: function () { ui.editProfile = true; ui.signup = null; render(); },
    unpublish: function () { var id = S.myProfile; if (id && ONLINE) push(CLOUD.deleteProfile(id)); if (id) { delete S.riders[id]; Object.keys(S.myRiders).forEach(function (k) { S.myRiders[k] = S.myRiders[k].filter(function (x) { return x !== id; }); }); } S.myProfile = null; ui.signup = null; save(); render(); toast('Perfil quitado de la bolsa'); },
    waQuick: function (el) { waReply(el.dataset.id, el.dataset.v); },
    waSend: function (el) { var i = document.getElementById('wamsg'); var v = (i && i.value || '').trim(); if (!v) return; waReply(el.dataset.id, v); },
    // promoter
    promoRest: function (el) { S.promo.restId = el.dataset.v; save(); render(); },
    mapGps: function () {
      if (!navigator.geolocation) { toast('Tu celular no permite ubicación'); return; }
      toast('Buscando tu ubicación…');
      navigator.geolocation.getCurrentPosition(function (p) { if (ui.map) ui.map.setView([p.coords.latitude, p.coords.longitude], 18); },
        function () { toast('No pudimos ver tu ubicación. Mueve el mapa con el dedo.'); }, { enableHighAccuracy: true, timeout: 10000 });
    },
    mapOk: function () {
      if (!ui.map || !ui.mapPick) return;
      var c = ui.map.getCenter(), g = { lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5) }, cb = ui.mapPick.onPick;
      ui.map.remove(); ui.map = null; ui.mapPick = null; sheet(null); cb(g);
    },
    rmLoc: function () {
      var f = ui.rm;
      openMap({ title: '¿Dónde está tu restaurante?', sub: 'Mueve el mapa hasta que el pin quede encima de tu local.', start: hasLoc(f) ? f : null,
        onPick: function (g) { f.lat = g.lat; f.lng = g.lng; render(); toast('Ubicación marcada. Toca Guardar datos.'); } });
    },
    // online: restaurant account, menu, rider delivery link
    restLoginDo: function () {
      var f = ui.login || {}, ph = String(f.phone || '').replace(/\D/g, '');
      if (ph.length !== 10) { ui.loginMsg = 'Escribe el WhatsApp del negocio (10 números).'; render(); return; }
      if (!f.pass) { ui.loginMsg = 'Escribe tu clave.'; render(); return; }
      if (ui.busy) return;
      ui.busy = true; ui.loginMsg = ''; render();
      CLOUD.restLogin(ph, f.pass).then(function () { return sync(true); }).then(function () {
        ui.busy = false; ui.login = null; S.role = 'rest'; S.seen = S.seen || {}; S.seen.rest = true; save(); go('/rest');
      }, function (e) { ui.busy = false; ui.loginMsg = /invalid/i.test(e.message) ? 'Número o clave incorrectos.' : errTxt(e); render(); });
    },
    restLogout: function () {
      CLOUD.restLogout().then(function () { S.restId = null; S.myRiders = {}; S.orders = S.orders.filter(function (o) { return o.mine; }); ui.rm = null; save(); sheet(null); go('/'); toast('Sesión cerrada'); sync(true); });
    },
    rmSet: function (el) { var k = el.dataset.k; ui.rm[k] = (k === 'fee' || k === 'min' || k === 'radius') ? +el.dataset.v : el.dataset.v; render(); },
    rmCatAdd: function () {
      var f = ui.rm, t = String(f.catNew || '').replace(/\s+/g, ' ').trim().slice(0, 20);
      if (t.length < 3) { toast('Escribe la categoría (mínimo 3 letras)'); return; }
      t = t.charAt(0).toUpperCase() + t.slice(1);
      var same = CATS.map(function (c) { return c[0]; }).concat(f.cats).filter(function (c) { return c.toLowerCase() === t.toLowerCase(); })[0];
      if (same) { if (f.cats.indexOf(same) < 0) f.cats.push(same); }
      else if (ownCats(f).length >= 3) { toast('Máximo 3 categorías propias'); return; }
      else f.cats.push(t);
      f.catNew = ''; render(); var sb = document.getElementById('saveBar'); if (sb) sb.classList.add('show');
    },
    rmCat: function (el) { var c = ui.rm.cats, i = c.indexOf(el.dataset.v); if (i >= 0) c.splice(i, 1); else c.push(el.dataset.v); render(); },
    rmImg: function (el) { ui.rm.img = el.dataset.v; render(); },
    horDay: function (el) {
      var h = ui.rm.hor, i = +el.dataset.v;
      if (h[i]) h[i] = null;
      else { var prev = [1, 2, 3, 4, 5, 6, 0].map(function (j) { return h[j]; }).filter(function (d) { return d; })[0]; h[i] = prev ? prev.slice() : [abreDe(ui.rm), cierraDe(ui.rm)]; }
      render();
    },
    horCopy: function () { var h = ui.rm.hor, mon = h[1] || [abreDe(ui.rm), cierraDe(ui.rm)]; for (var i = 0; i < 7; i++) if (h[i]) h[i] = mon.slice(); render(); toast('Mismo horario todos los días abiertos'); },
    rmSave: function () {
      var f = ui.rm; if (!f || ui.busy) return;
      if (!String(f.name || '').trim()) { toast('Escribe el nombre'); return; }
      var fields = { name: f.name.trim(), short: shortName(f.name), sub: String(f.sub || '').trim(), address: String(f.address || '').trim(),
        phone: String(f.phone || '').replace(/\D/g, ''), nequi: String(f.nequi || '').trim(), fee: +f.fee || 0, min: +f.min || 0, eta: f.eta, img: f.img, cats: f.cats.slice(), radius_km: +f.radius || 3 };
      if (horOn()) {
        var bad = [1, 2, 3, 4, 5, 6, 0].filter(function (i) { return f.hor[i] && hm(f.hor[i][1]) < hm(f.hor[i][0]) + 60; })[0];
        if (bad != null) { toast(capi(DIAS[bad]) + ': la hora de cerrar debe ser al menos 1 hora después de abrir'); return; }
        if (!f.hor.some(function (d) { return d; })) { toast('Deja al menos un día abierto'); return; }
        if (!R(S.restId).horario || JSON.stringify(f.hor) !== JSON.stringify(R(S.restId).horario)) fields.horario = f.hor;
      } else {
        if (hm(f.cierra) < hm(f.abre) + 60) { toast('La hora de cerrar debe ser al menos 1 hora después de abrir'); return; }
        if (f.abre !== abreDe(R(S.restId)) || f.cierra !== cierraDe(R(S.restId))) { fields.abre = f.abre; fields.cierra = f.cierra; }
      }
      if (hasLoc(f)) { fields.lat = f.lat; fields.lng = f.lng; }
      if ((f.kind || 'restaurante') !== (R(S.restId).kind || 'restaurante')) fields.kind = f.kind;
      ui.busy = true; render();
      CLOUD.updateRest(fields).then(function () { ui.busy = false; Object.assign(R(S.restId), fields, { radius: fields.radius_km }); ui.rm = null; render(); toast('Datos guardados'); sync(); },
        function (e) { ui.busy = false; render(); toast(/kind/.test(String(e && e.message)) ? 'Falta un paso en la base de datos (004-tiendas.sql).' : /horario/.test(String(e && e.message)) ? 'Falta un paso en la base de datos (012-horario.sql).' : /abre|cierra/.test(String(e && e.message)) ? 'Falta un paso en la base de datos (009-programar.sql).' : errTxt(e)); });
    },
    dishForm: function () {
      ui.dish = { img: IMG.asado, sec: 'Platos' };
      sheet('<div class="t-h2">Agregar un plato</div>' +
        '<label class="label mt12" for="dn">Nombre</label><input class="input" id="dn" placeholder="Carne a la llanera" autocomplete="off">' +
        '<label class="label mt12" for="dd">Descripción (opcional)</label><input class="input" id="dd" placeholder="300 g, yuca, papa y ají" autocomplete="off">' +
        '<label class="label mt12" for="dp">Precio</label><input class="input" id="dp" inputmode="numeric" placeholder="25000">' +
        '<div class="label mt12">Sección del menú</div><div class="chips" id="dSec">' + secChips('Platos', 'dishSecPick') + '</div>' +
        '<div class="label mt12">Foto del plato</div><div id="dishPh">' + photoPick(ui.dish.img, 'dishImg', 'dish') + '</div><div class="xs muted mt4">Una foto propia vende más. Tómala con buena luz, de cerca.</div>' +
        '<div id="dErr" class="err-msg"></div><button class="btn btn-primary btn-block mt16" data-a="dishAdd">Agregar al menú</button>');
    },
    dishImg: function (el) { ui.dish.img = el.dataset.v; refreshPick('dish'); },
    dishSecPick: function (el) { ui.dish.sec = el.dataset.v; document.getElementById('dSec').innerHTML = secChips(ui.dish.sec, 'dishSecPick'); },
    dishSec: function (el) {
      var r = R(S.restId), d = r.dishes.filter(function (x) { return x.id === el.dataset.v; })[0]; if (!d) return;
      sheet('<div class="t-h2">¿En qué sección va?</div><div class="muted mt4">' + esc(d.name) + '</div><div class="chips mt16">' + secChips(secOf(d), 'dishSecSet', d.id) + '</div><div class="xs muted mt12">Tus clientes ven el menú separado por secciones y pueden saltar directo a Bebidas, Adicionales, etc.</div>');
    },
    dishSecSet: function (el) {
      var r = R(S.restId), dishes = r.dishes.map(function (x) { return x.id === el.dataset.d ? Object.assign({}, x, { sec: el.dataset.v }) : x; });
      r.dishes = dishes; sheet(null); render(); push(CLOUD.updateRest({ dishes: dishes })); toast('Guardado en ' + el.dataset.v);
    },
    dishAdd: function (el) {
      var n = document.getElementById('dn').value.trim(), d = document.getElementById('dd').value.trim(), pr = +String(document.getElementById('dp').value).replace(/\D/g, '');
      if (!n) { document.getElementById('dErr').textContent = 'Escribe el nombre del plato.'; return; }
      if (!pr || pr < 500) { document.getElementById('dErr').textContent = 'Escribe el precio en pesos (ej.: 25000).'; return; }
      var r = R(S.restId), dishes = r.dishes.concat([{ id: 'd' + now().toString(36), name: n, desc: d, price: pr, img: ui.dish.img, sec: ui.dish.sec || 'Platos', top: !r.dishes.length }]);
      el.disabled = true;
      CLOUD.updateRest({ dishes: dishes }).then(function () { r.dishes = dishes; sheet(null); render(); toast(n + ' agregado'); sync(); },
        function (e) { el.disabled = false; document.getElementById('dErr').textContent = errTxt(e); });
    },
    dishDel: function (el) {
      var r = R(S.restId), dishes = r.dishes.filter(function (d) { return d.id !== el.dataset.v; });
      r.dishes = dishes; render(); push(CLOUD.updateRest({ dishes: dishes })); toast('Plato quitado');
    },
    entregaDo: function () {
      var e = ui.ent, v = ((document.getElementById('entPin') || {}).value || '').trim();
      if (!e || ui.busy) return;
      if (!/^\d{4}$/.test(v)) { e.msg = 'Escribe los 4 números.'; render(); return; }
      ui.busy = true; render();
      CLOUD.deliver(e.id, v, false).then(function (res) {
        ui.busy = false;
        if (res === 'ok' || res === 'ya_entregado') { e.done = true; e.msg = ''; } else e.msg = PIN_TXT[res] || 'No se pudo confirmar.';
        render();
      }, function (err) { ui.busy = false; e.msg = errTxt(err); render(); });
    },
    entregaPick: function () {
      var e = ui.ent;
      if (!e || ui.busy) return;
      ui.busy = true; render();
      CLOUD.riderPicked(e.id, e.key).then(function (res) {
        ui.busy = false;
        if (res === 'ok' && e.info) { e.info.picked_at = new Date().toISOString(); e.info.status = 'en_camino'; e.msg = ''; toast('Listo. Buen viaje.'); }
        else e.msg = PIN_TXT[res] || 'No se pudo guardar.';
        render();
      }, function (err) { ui.busy = false; e.msg = /rider_picked|function/i.test(String(err && err.message)) ? 'Falta un paso en la base de datos (014-entrega.sql).' : errTxt(err); render(); });
    },
    copyLink: function () {
      var link = promoLink(S.promo.restId);
      var done = function () { toast('Enlace copiado'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(link).then(done, fallback); else fallback();
      function fallback() { var t = document.createElement('textarea'); t.value = link; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast(link); } t.remove(); }
    },
    downloadQR: function () { downloadQR(); },
    pctEdit: function () {
      sheet('<div class="t-h2">Comisión del promotor</div><div class="small muted mt4">Aún no está decidida. Cámbiala para ver cómo se ve.</div><div class="chips mt12">' + [3, 5, 8, 10].map(function (p) { return '<button class="chip' + (S.promo.pct === p ? ' on' : '') + '" data-a="pct" data-v="' + p + '">' + p + '%</button>'; }).join('') + '</div>');
    },
    pct: function (el) { S.promo.pct = +el.dataset.v; save(); sheet(null); render(); },
    // shops
    prontoAll: function () { ui.prontoAll = true; render(); },
    goPueblo: function () { sheet(null); go('/pueblo'); },
    pickTown: function (el) { setTown(el.dataset.v); ui.home = null; go('/inicio'); },
    townGeo: function () {
      if (!navigator.geolocation) { toast('Tu celular no comparte la ubicación. Elige el pueblo de la lista.'); return; }
      toast('Buscando tu ubicación…');
      navigator.geolocation.getCurrentPosition(function (pos) {
        var best = null, bd = 1e9, me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        Object.keys(TOWN_GEO).forEach(function (t) { var d = km(me, { lat: TOWN_GEO[t][0], lng: TOWN_GEO[t][1] }); if (d < bd) { bd = d; best = t; } });
        if (best && bd <= 25) { setTown(best); ui.home = null; go('/inicio'); toast('Estás en ' + best); }
        else toast('No estás cerca de nuestros pueblos. Elige uno de la lista.');
      }, function () { toast('No pudimos ver tu ubicación. Elige el pueblo de la lista.'); }, { timeout: 10000, maximumAge: 600000 });
    },
    ptown: function (el) { ui.ptown = el.dataset.v; ui.prontoAll = false; try { localStorage.setItem('pyi-town', ui.ptown); } catch (e) {} render(); },
    sugKind: function (el) { ui.sug.kind = el.dataset.v; render(); },
    sugAgain: function () { ui.sug = null; ui.sugDone = null; render(); },
    sugSend: function () {
      var f = ui.sug; if (!f || ui.sugBusy) return;
      var name = String(f.name || '').replace(/\s+/g, ' ').trim(), town = String(f.town || '').replace(/\s+/g, ' ').trim();
      if (name.length < 3 || /\d{6,}|https?:|www\./i.test(name)) { ui.sugErr = 'name'; render(); toast('Escribe el nombre del negocio, sin teléfonos ni enlaces.'); return; }
      if (town.length < 3) { ui.sugErr = 'town'; render(); toast('¿En qué pueblo queda?'); return; }
      ui.sugErr = '';
      if (name === name.toLowerCase()) name = name.replace(/(^|\s)(\S)/g, function (m, a, c) { return a + c.toUpperCase(); });
      town = town.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      for (var i = 0; i < RESTAURANTS.length; i++) if (townOf(RESTAURANTS[i]).toLowerCase() === town.toLowerCase() && shown().indexOf(RESTAURANTS[i]) >= 0 && sameBiz(name, RESTAURANTS[i].name)) { toast('¡Ya está en Pido y Ido! Le puedes pedir aquí.'); go('/r/' + RESTAURANTS[i].id); return; }
      var known = allPronto().filter(function (p) { return p.town.toLowerCase() === town.toLowerCase() && sameBiz(name, p.name); })[0];
      if (known) { vote(known.id); ui.sug = null; toast('Ya estaba en la lista. Sumamos tu voto.'); go('/negocio/' + known.id); return; }
      var id = (slug(name) + (town.toLowerCase() !== 'villanueva' ? '-' + slug(town) : '')).slice(0, 80).replace(/-$/, '');
      if (id.length < 2) { ui.sugErr = 'name'; render(); return; }
      var row = { slug: id, name: name, kind: f.kind, town: town, note: String(f.note || '').trim().slice(0, 300) };
      if (!ONLINE) {
        try { var l = JSON.parse(localStorage.getItem(SK) || '[]') || []; l.push(row); localStorage.setItem(SK, JSON.stringify(l)); } catch (e) {}
        EXTRA.push(extraFrom(row)); vote(id); ui.sug = null; toast('¡Gracias! En la demo aparece de una vez.'); go('/negocio/' + id); return;
      }
      ui.sugBusy = true; render();
      CLOUD.suggestBiz(row).then(function (res) {
        ui.sugBusy = false;
        if (res === 'limite') { render(); toast('Ya enviaste varias sugerencias hoy. Intenta mañana.'); return; }
        myV[id] = 1; try { localStorage.setItem(VK, JSON.stringify(myV)); } catch (e) {}
        ui.sugDone = name; ui.sug = null; votes.at = 0; render();
      }, function () { ui.sugBusy = false; render(); toast('No se pudo enviar. Revisa tu internet.'); });
    },
    vote: function (el) { vote(el.dataset.v); render(); toast('¡Gracias! Ahora invítalo por WhatsApp.'); },
    claim: function (el) {
      var p = prontoById(el.dataset.v); if (!p) return;
      ui.reg = { kind: p.kind, name: p.name, phone: '', addr: '', pass: '', town: p.town };
      go('/rest/registro');
    },
    homeTab: function (el) { ui.home = el.dataset.v; ui.kind = null; ui.cat = null; render(); },
    kindPick: function (el) { ui.kind = el.dataset.v && ui.kind !== el.dataset.v ? el.dataset.v : null; render(); },
    regKind: function (el) { ui.reg = ui.reg || { name: '', phone: '', addr: '', pass: '' }; ui.reg.kind = el.dataset.v; render(); },
    wishImgDel: function () { S.cart.wishImg = ''; ui.wishPrev = null; save(); render(); }
  };
  // Shop sets the price of a free order and accepts it.
  function acceptPriced(o) {
    var amount = +String(ui.choose['p' + o.id] || '').replace(/\D/g, ''), eta = o.scheduledFor ? Math.min(240, Math.max(5, Math.round((o.scheduledFor - now()) / 60000))) : ui.choose['eta' + o.id] || 30;
    if (!amount || amount < 500) { toast('Escribe el valor de los productos (ej.: 23000)'); var x = document.getElementById('wp' + o.id); if (x) { x.classList.add('err'); x.focus(); } return; }
    var apply = function () {
      o.subtotal = amount; o.total = amount + (o.fee || 0); o.status = 'preparando'; o.etaMin = eta; o.acceptedAt = now();
      if (o.pay === 'ef' && o.cashGiven < o.total) o.cashGiven = o.total;
      delete ui.choose['p' + o.id]; ui.rtab = 'preparando'; save(); render(); toast('Aceptado por ' + fmt(o.total) + '. ' + first(o.customer.name) + ' ya ve el precio');
    };
    if (!ONLINE) return apply();
    if (ui.busy) return;
    ui.busy = true;
    CLOUD.priceOrder(o.dbId, amount, eta).then(function (res) {
      ui.busy = false;
      if (res === 'ok') { apply(); sync(); return; }
      toast(res === 'cerrado' ? 'Este pedido ya no está esperando (¿lo cancelaron?).' : res === 'monto' ? 'Revisa el valor.' : 'No se pudo aceptar.'); sync(true);
    }, function (e) { ui.busy = false; toast(/price_order|function/i.test(String(e && e.message)) ? 'Falta un paso en la base de datos (004-tiendas.sql).' : errTxt(e)); });
  }
  // by: 'cliente' (Ya lo recibí), 'domiciliario' (enlace + código) o 'negocio' (panel + código).
  function deliver(o, by) {
    o.status = 'entregado'; o.deliveredAt = now(); o.deliveredBy = by || o.deliveredBy || '';
  }
  function porTxt(o) {
    return { cliente: 'lo confirmó el cliente', domiciliario: 'lo confirmó el domiciliario con el código', negocio: 'lo confirmaste con el código', auto: 'se cerró solo después de ' + AUTO_H + ' horas' }[o.deliveredBy] || '';
  }
  function waReply(id, text) {
    var o = order(id); if (!o) return;
    var chat = S.chats[id] = S.chats[id] || [];
    chat.push({ out: true, text: text, t: now() });
    var m = text.match(/^\s*entregado\s*#?\s*(\d{4})\s*$/i);
    if (/^(voy en camino|recogido|ya lo recog[ií])$/i.test(text.trim())) {
      o.onWay = true; o.pickedAt = o.pickedAt || now(); chat.push({ text: 'Listo, le avisamos a ' + first(o.customer.name) + ' que vas en camino.', t: now() });
    } else if (m) {
      if (o.status !== 'en_camino') chat.push({ text: 'Este pedido ya estaba cerrado.', t: now() });
      else if (m[1] === o.pin) { deliver(o, 'domiciliario'); chat.push({ ok: true, text: 'Código correcto. Pedido #' + o.id + ' entregado. ¡Gracias, ' + callName(rider(o.riderId) ? rider(o.riderId).name : '') + '!', t: now() }); }
      else chat.push({ text: 'Código incorrecto. Pídele al cliente el código de 4 números y escribe: ENTREGADO + código.', t: now() });
    } else if (/^entregado/i.test(text)) {
      chat.push({ text: 'Falta el código. Escribe por ejemplo: ENTREGADO 1234', t: now() });
    } else {
      chat.push({ text: 'Recibido. Para cerrar el pedido escribe: ENTREGADO + el código del cliente.', t: now() });
    }
    save(); render();
  }

  // ---------- Online sync ----------
  var PIN_TXT = { incorrecto: 'Código incorrecto. Revisa con el cliente.', bloqueado: 'Demasiados intentos. El restaurante debe llamar al cliente.', cerrado: 'Este pedido ya no está en camino.', no_existe: 'No encontramos este pedido.' };
  function errTxt(e) {
    var m = String((e && (e.message || e.error_description)) || e || '');
    if (/closed/.test(m)) return 'El restaurante acaba de cerrar. Intenta más tarde.';
    if (/below_min/.test(m)) return 'No alcanza el pedido mínimo.';
    if (/too_soon|too_late|out_of_hours/.test(m)) return 'Esa hora ya no se puede programar. Elige otra.';
    if (/too_far/.test(m)) return 'Estás fuera de la zona de entrega. Elige Recoger.';
    if (/not_approved/.test(m)) return 'Este negocio todavía no está activo en Pido y Ido.';
    if (/too_many_open/.test(m)) return 'Ya tienes 3 pedidos en curso. Espera a que llegue uno para pedir otro.';
    if (/too_many/.test(m)) return 'Hiciste muchos pedidos en poco tiempo. Intenta en un rato.';
    if (/need_phone/.test(m)) return 'Confirma tu número con el código de WhatsApp para pedir.';
    if (/blocked/.test(m)) return 'Este número no puede hacer pedidos. Escríbele a Pido y Ido.';
    if (/order_closed/.test(m)) return 'Este pedido ya está cerrado y no se puede cambiar.';
    if (/no_geo/.test(m)) return 'Marca tu casa en el mapa.';
    if (/dish_gone/.test(m)) return 'Un plato ya no está en el menú. Revisa tu carrito.';
    if (/already registered|already_exists|duplicate key.*users/i.test(m)) return 'Ese número ya tiene cuenta. Inicia sesión.';
    if (/confirm_email_on/.test(m)) return 'Falta un ajuste: en Supabase apaga "Confirm email".';
    if (/anonymous/i.test(m)) return 'Falta un ajuste: en Supabase activa "Anonymous sign-ins".';
    if (/fetch|network|Failed|Load failed/i.test(m)) return 'Sin conexión. Revisa tu internet e intenta otra vez.';
    return 'No se pudo guardar (' + m.slice(0, 80) + ')';
  }
  // Errores del código de WhatsApp (Supabase Auth).
  function codeErr(e) {
    var m = String((e && (e.message || e.error_description || e.code)) || e || '');
    if (/expired|invalid|otp_expired|Token has expired/i.test(m)) return 'Ese código no sirve o ya venció. Revisa los números o pide uno nuevo.';
    if (/rate|seconds|too many|over_sms_send_rate_limit/i.test(m)) return 'Espera un minuto antes de pedir otro código.';
    if (/phone_provider_disabled|Unsupported phone provider|provider/i.test(m)) return 'El inicio con WhatsApp todavía no está activo. Intenta más tarde.';
    if (/configurado|hook/i.test(m)) return 'No pudimos mandar el WhatsApp. Intenta más tarde.';
    if (/fetch|network|Failed|Load failed/i.test(m)) return 'Sin conexión. Revisa tu internet e intenta otra vez.';
    return 'No se pudo (' + m.slice(0, 80) + ')';
  }
  function push(p) { if (p && p.then) p.then(function () { sync(); }, function (e) { console.warn(e); toast(errTxt(e)); sync(true); }); }
  function shortName(n) { return String(n || '').trim().replace(/^(asadero|restaurante|pizzería|pizzeria|cafetería|cafeteria|droguería|drogueria|farmacia|minimercado|supermercado|tienda|licorera|floristería|floristeria|ferretería|ferreteria)\s+/i, ''); }
  function regLive() {
    var f = ui.reg || {}, logged = !!CLOUD.restUid(), err = {}, ph = String(f.phone || '').replace(/\D/g, '');
    if (!String(f.name || '').trim()) err.name = 1;
    if (!logged && ph.length !== 10) err.phone = 1;
    if (String(f.addr || '').trim().length < 5) err.addr = 1;
    if (String(f.town || '').trim().length < 3) err.town = 1;
    if (!logged && String(f.pass || '').length < 6) err.pass = 1;
    if (!f.legal) err.legal = 1;
    ui.regErr = err;
    ui.regMsg = err.name ? 'Escribe el nombre del negocio.' : err.phone ? 'El WhatsApp debe tener 10 números.' : err.addr ? 'Escribe la dirección.' : err.town ? '¿En qué pueblo queda tu negocio?' : err.pass ? 'La clave debe tener mínimo 6 letras o números.' : err.legal ? 'Para seguir, acepta los términos y la política de datos.' : '';
    if (ui.regMsg || ui.busy) { render(); return; }
    var name = f.name.trim();
    var slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) + '-' + Math.random().toString(36).slice(2, 6);
    var shop = isShop(f);
    var data = { id: slug, name: name, short: shortName(name), sub: '', img: shop ? '' : IMG.asado, cats: [], address: f.addr.trim(), phone: ph, nequi: ph ? phoneFmt(ph) : '', dishes: [], open: false };
    var tw = String(f.town || '').replace(/\s+/g, ' ').trim(), known = allTowns().filter(function (t) { return t.toLowerCase() === tw.toLowerCase(); })[0];
    data.town = known || tw.replace(/(^|\s)(\S)/g, function (m, a, c) { return a + c.toUpperCase(); });
    if (shop) data.kind = f.kind;
    ui.busy = true; render();
    (logged ? CLOUD.createRest(data) : CLOUD.restSignup(ph, f.pass, data)).then(function () { return sync(true); }).then(function () {
      ui.busy = false; ui.reg = null; ui.regErr = null; S.role = 'rest'; S.seen = S.seen || {}; S.seen.rest = true; save();
      go('/rest/menu'); toast(shop ? '¡Bienvenido! Ahora marca tu tienda en el mapa.' : '¡Bienvenido! Ahora agrega tu menú.');
      if (!logged) setTimeout(function () { A.recoveryNew(); }, 600);
    }, function (e) { ui.busy = false; ui.regMsg = /kind/.test(String(e && e.message)) ? 'Las tiendas se activan muy pronto. Escríbele a Pido y Ido.' : errTxt(e); render(); });
  }
  var syncing = null, lastSig = '', seenNew = null;
  // Demo: la misma regla que close_stale() en 015-cierre.sql.
  function closeStaleLocal() {
    if (ONLINE) return false;
    var t = now(), ch = false;
    S.orders.forEach(function (o) {
      if (o.status === 'recibido' && t > noRespAt(o)) { o.status = 'sin_respuesta'; o.rejectReason = 'No respondieron a tiempo.'; ch = true; }
      else if (['preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0 && t > autoAt(o)) {
        if (o.payOk === false) { o.status = 'no_entregado'; o.rejectReason = 'El pago no llegó.'; } else deliver(o, 'auto');
        ch = true;
      }
    });
    if (ch) save();
    return ch;
  }
  // Aviso del sistema (también con la app en segundo plano, mientras siga abierta).
  function notifyNew(text) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      var opt = { body: 'Ábrelo en Pido y Ido para aceptarlo.', icon: ((document.querySelector('link[sizes="192x192"]') || {}).href || ''), tag: 'pyi-nuevo', renotify: true, vibrate: [300, 150, 300] };
      var plain = function () { try { new Notification(text, opt); } catch (e) {} };
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(function (reg) { if (reg) reg.showNotification(text, opt); else plain(); }, plain);
      else plain();
    } catch (e) {}
  }
  // La pantalla no se apaga mientras el panel del negocio está abierto (si el celular lo permite).
  var wakeLock = null;
  function keepAwake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock && document.visibilityState === 'visible') {
        wakeLock = 1;
        navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; w.addEventListener('release', function () { wakeLock = null; }); }, function () { wakeLock = null; });
      } else if (!on && wakeLock && wakeLock.release) { wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }
  function beep() {
    try {
      var A2 = window.AudioContext || window.webkitAudioContext; if (!A2) return;
      var c = beep.c || (beep.c = new A2());
      [0, 0.25, 0.5].forEach(function (t) { var o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(0.25, c.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.2); o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.21); });
    } catch (e) {}
    try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {}
  }
  function applyCloud(d) {
    Array.prototype.splice.apply(RESTAURANTS, [0, RESTAURANTS.length].concat(d.restaurants));
    S.restCache = d.restaurants;
    S.open = {}; d.restaurants.forEach(function (r) { S.open[r.id] = r.open; });
    S.ratings = {};
    S.orders = d.orders;
    S.riders = d.riders;
    S.myRiders = {}; if (d.myRest) S.myRiders[d.myRest] = d.myRiders;
    S.myProfile = d.myProfile;
    S.reward = d.reward || null;
    S.custPhone = d.custPhone || '';
    S.hasRecovery = d.hasRecovery;
    S.restId = d.myRest;
    save();
    // new order sound for the restaurant
    var fresh = d.orders.filter(function (o) { return o.restId === d.myRest && o.status === 'recibido'; }).map(function (o) { return o.id; });
    if (seenNew) {
      var nuevos = fresh.filter(function (id) { return seenNew.indexOf(id) < 0; });
      if (nuevos.length) { var nt = nuevos.length > 1 ? nuevos.length + ' pedidos nuevos' : '¡Pedido nuevo #' + nuevos[0] + '!'; beep(); toast(nt); notifyNew(nt); }
    }
    seenNew = d.myRest ? fresh : null;
    document.title = fresh.length ? '(' + fresh.length + ') Pido y Ido' : 'Pido y Ido';
  }
  function sync(force) {
    if (!ONLINE) return Promise.resolve();
    if (syncing) { if (force) syncing.again = true; return syncing; }
    syncing = CLOUD.fetchAll().then(function (d) {
      var sig = JSON.stringify(d);
      var first = !ui.synced;
      ui.synced = true; ui.offline = false;
      if (sig !== lastSig || force || first || ui.pendingRender) { lastSig = sig; applyCloud(d); safeRender(); }
    }, function (e) {
      console.warn('sync', e);
      if (!ui.offline) { ui.offline = true; toast(errTxt(e)); }
    }).then(function () {
      var again = syncing && syncing.again; syncing = null;
      if (again) return sync(true);
    });
    return syncing;
  }
  function safeRender() {
    var a = document.activeElement;
    if (document.querySelector('.sheet-bg') || (a && /INPUT|TEXTAREA/.test(a.tagName))) { ui.pendingRender = true; return; }
    render();
  }

  // ---------- Events ----------
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-a]');
    if (!el) return;
    if (el.dataset.a === 'closeSheet' && ev.target.closest('[data-stop]') && el.classList.contains('sheet-bg')) return;
    var fn = A[el.dataset.a];
    if (fn) { ev.preventDefault(); fn(el, ev); }
  });
  document.addEventListener('click', function (ev) {
    var v = ev.target.closest('[data-vote]'); if (v) { vote(v.dataset.vote); setTimeout(safeRender, 400); }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.m) { setPath(t.dataset.m, t.value); t.classList.remove('err'); }
    if (t.dataset.pin) { t.value = t.value.replace(/\D/g, '').slice(0, 4); var bx = t.parentNode.querySelectorAll('.pin-boxes i'); for (var k = 0; k < bx.length; k++) { bx[k].textContent = t.value[k] || ''; bx[k].className = k === t.value.length ? 'cur' : ''; } }
    if (t.dataset.price) { ui.choose['p' + t.dataset.price] = t.value.replace(/\D/g, ''); t.classList.remove('err'); }
    if (t.dataset.wish) {
      var wr = t.dataset.wish;
      if (S.cart.restId !== wr) { ensureWishCart(wr); var nt = t.parentNode.querySelector('.note.amber'); if (nt) nt.remove(); }
      S.cart.wish = t.value; save();
      var cb = document.getElementById('cbar'); if (cb) cb.innerHTML = cartBar(false);
    }
    if (t.dataset.dirty) { var sb = document.getElementById('saveBar'); if (sb) sb.classList.add('show'); }
    if (t.dataset.live === 'q') { ui.q = t.value; var res = document.getElementById('results'); if (res) res.innerHTML = searchResults(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.dataset.aChange === 'cc') { S.user.cc = t.value; save(); render(); var pi = document.getElementById('ph'); if (pi) pi.focus(); return; }
    if (t.dataset.file === 'wish' && t.files && t.files[0]) { uploadWish(t.files[0], t.dataset.r); t.value = ''; return; }
    if ((t.dataset.file === 'restImg' || t.dataset.file === 'dishImg') && t.files && t.files[0]) { uploadOwnPhoto(t.files[0], t.dataset.file === 'dishImg' ? 'dish' : 'rest'); t.value = ''; return; }
    if (t.dataset.file && t.files && t.files[0]) { (t.dataset.file === 'menu' ? ui.reg : ui.signup)[t.dataset.file] = true; render(); toast('Foto agregada'); }
  });
  document.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (ev.key === 'Enter' && t.dataset && t.dataset.enter) { ev.preventDefault(); A[t.dataset.enter](t); }
  });
  function secMark(k) {
    var bs = document.querySelectorAll('#secTabs .chip');
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', i === k);
    var on = bs[k]; if (on && on.parentNode.scrollTo) on.parentNode.scrollTo({ left: on.offsetLeft - 16, behavior: 'smooth' });
  }
  window.addEventListener('scroll', function () {
    var bar = document.getElementById('secTabs'); if (!bar) return;
    var blocks = document.querySelectorAll('.sec-block'), lim = bar.getBoundingClientRect().bottom + 24, k = 0;
    for (var i = 0; i < blocks.length; i++) if (blocks[i].getBoundingClientRect().top <= lim) k = i;
    if (k !== secMark.last) { secMark.last = k; secMark(k); }
  }, { passive: true });
  // ---------- Celebración: confeti cuando el pedido quedó listo (efectivo) o pagado (Nequi / Daviplata), y la tarjeta de sellos en el 5º pedido ----------
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.createElement('canvas'), x = c.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.className = 'confetti'; c.width = W * dpr; c.height = H * dpr; x.scale(dpr, dpr); document.body.appendChild(c);
    var cols = ['#FF6B2C', '#1F4D3A', '#FFC93C', '#FFFFFF', '#F2994A', '#3FA16B'], ps = [];
    function burst(ox, oy, n, spread) { for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (Math.random() - .5) * spread, v = 7 + Math.random() * 9; ps.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: cols[i % cols.length], round: Math.random() < .25 }); } }
    burst(W * .15, H * .95, 70, 1.2); burst(W * .85, H * .95, 70, 1.2);
    setTimeout(function () { burst(W / 2, H * .55, 90, 6.28); }, 380);
    var t0 = performance.now();
    (function tick(t) {
      x.clearRect(0, 0, W, H);
      ps.forEach(function (p) { p.vy += .32; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - (t - t0) / 3600);
        if (p.round) { x.beginPath(); x.arc(0, 0, p.w / 2, 0, 6.28); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 4, p.w, p.h / 2 * (0.4 + Math.abs(Math.cos(p.r * 2))));
        x.restore(); });
      if (t - t0 < 3600) requestAnimationFrame(tick); else c.remove();
    })(t0);
  }
  function celebrate(o, kind) {
    var r = R(o.restId), fifth = kind === 'placed' && o.discount > 0, cash = o.pay === 'ef';
    var title = fifth ? '¡Es tu 5º pedido!' : kind === 'paid' ? '¡Pago avisado!' : o.scheduledFor ? '¡Pedido programado!' : '¡Pedido enviado!';
    var sub = fifth ? 'Llenaste tu tarjeta de sellos: este pedido tiene <b>' + fmt(o.discount) + ' de descuento</b>. Ya está restado del total.'
      : kind === 'paid' ? 'Le avisamos a ' + esc(r.short) + ' que transferiste ' + fmt(o.total) + '. Ellos lo confirman en su ' + (o.pay === 'nequi' ? 'Nequi' : 'Daviplata') + '.'
      : o.scheduledFor ? esc(r.short) + ' lo tiene para ' + cuandoCo(o.scheduledFor) + '.' + (cash ? ' Pagas en efectivo al recibir.' : '')
      : cash ? 'Le llegó a ' + esc(r.short) + '. Pagas ' + fmt(o.total) + ' en efectivo al recibir. ¡Todo listo!' : 'Le llegó a ' + esc(r.short) + '. Cuando lo acepte, aquí te mostramos el número para pagar.';
    var art = fifth ? '<div class="stamps big cel-stamps">' + [0, 1, 2, 3].map(function (i) { return '<i class="on" style="animation-delay:' + (i * 140) + 'ms">' + ic('check', 18, { sw: 3 }) + '</i>'; }).join('') + '<i class="gift on" style="animation-delay:640ms">' + ic('gift', 22) + '</i></div><div class="cel-save">−' + fmt(o.discount) + '</div>'
      : '<div class="cel-check">' + ic('check', 46, { sw: 3 }) + '</div>';
    var d = document.createElement('div'); d.className = 'celebrate' + (fifth ? ' fifth' : '');
    d.innerHTML = '<div class="cel-card" role="dialog" aria-live="polite">' + art + '<div class="t-title mt16" style="font-size:26px">' + title + '</div><div class="muted mt8">' + sub + '</div><button class="btn btn-primary btn-block btn-xl mt20" data-cel="1">Ver mi pedido</button></div>';
    document.body.appendChild(d);
    var close = function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 250); };
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-cel]')) close(); });
    if (fifth || kind === 'paid' || cash) setTimeout(confetti, fifth ? 700 : 120);
    if (navigator.vibrate) try { navigator.vibrate(fifth ? [60, 60, 60, 60, 160] : [40, 50, 80]); } catch (e) {}
  }
  function copyTxt(txt, msg) {
    var done = function () { toast(msg || 'Copiado'); };
    function fallback() { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast(txt); } t.remove(); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
  }
  // Al volver de Nequi / Daviplata: preguntar si ya transfirió.
  function payBack() {
    var po = S.payOut; if (!po || now() - po.at > 30 * 60000 || now() - po.at < 3000) return;
    var o = order(po.id); if (!o || o.paidClaimAt || o.payOk === true || ['preparando', 'listo', 'en_camino'].indexOf(o.status) < 0) { S.payOut = null; save(); return; }
    if (parse().path !== '/pedido/' + o.id) go('/pedido/' + o.id);
    sheet('<div class="center"><div class="big-check" style="margin-top:0">' + ic('wallet', 36) + '</div><div class="t-h2 mt12">¿Ya transferiste ' + fmt(o.total) + '?</div><div class="muted mt4">Así le avisamos a ' + esc(R(o.restId).short) + ' para que lo revise.</div></div>' +
      '<button class="btn btn-green btn-block btn-xl mt16" data-a="markPaid" data-id="' + o.id + '">' + ic('check', 18) + ' Sí, ya transferí</button><button class="btn btn-ghost btn-block mt8" data-a="payNotYet">Todavía no</button>');
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(payBack, 400); });
  window.addEventListener('hashchange', render);
  if (!ONLINE) window.addEventListener('storage', function (e) { if (e.key === KEY) { S = load(); render(); } });
  if (ONLINE) {
    CLOUD.live(function () { sync(); });
    setInterval(function () { if (document.visibilityState !== 'hidden') sync(); }, 10000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { sync(); keepAwake(parse().parts[0] === 'rest' && !!S.restId); } });
    window.addEventListener('online', function () { sync(); });
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ui.installEvt = e; if (parse().parts.length === 0) render(); });
  closeStaleLocal();
  setInterval(function () {
    if (closeStaleLocal()) safeRender();
    var p = parse().parts[0];
    if ((p === 'pedido' || p === 'rest') && !document.querySelector('.sheet-bg') && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) render();
  }, 20000);

  // ---------- Splash + first route ----------
  (function boot() {
    var h = location.hash.replace(/^#/, '');
    if ((!h || h === '/') && S.role) location.replace('#' + roleById(S.role).home);
    var sp = document.createElement('div');
    sp.className = 'splash';
    sp.innerHTML = '<div class="splash-mid">' + logo(104, 'white') + '<span>Pido y Ido</span></div><span class="splash-foot">VILLANUEVA · CASANARE</span>';
    document.body.appendChild(sp);
    setTimeout(function () { sp.classList.add('out'); setTimeout(function () { sp.remove(); }, 400); }, 1500);
  })();
  render();
  sync();
  setTimeout(payBack, 2500);
})();
