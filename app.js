/* Pido y Ido — prototipo funcional (datos de demo guardados en este celular) */
(function () {
  'use strict';

  // ---------- Helpers ----------
  var PX = function (id, w) { return 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=' + (w || 500); };
  var US = function (id, w) { return 'https://images.unsplash.com/photo-' + id + '?w=' + (w || 500) + '&q=70&auto=format&fit=crop'; };
  var IMG = {
    carne: US('1558030006-450675393462'), asado: PX(14515096, 900), pollo: US('1598103442097-8b74394b95c6'),
    emp: PX(6535195), arepa: PX(29496090), burger: US('1568901346375-23c9450c58cd'),
    pizza: US('1574071318508-1cdbab80d002'), pizza2: US('1513104890138-7c749659a591', 900),
    jugo: US('1546173159-315724a31696'), pincho: US('1555939594-58d7cb561ad1', 900)
  };
  function fmt(n) { return '$' + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function now() { return Date.now(); }
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
  function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); }
  function phoneFmt(p) { p = String(p || '').replace(/\D/g, ''); return p.length === 10 ? p.slice(0, 3) + ' ' + p.slice(3, 6) + ' ' + p.slice(6) : p; }
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
    fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.4 1.5 1.7 2.8 3.5 2.8z"/>'
  };
  function ic(name, size, opts) {
    opts = opts || {};
    var fill = opts.fill ? 'fill="currentColor"' : 'fill="none"';
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" ' + fill + ' stroke="currentColor" stroke-width="' + (opts.sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[name] + '</svg>';
  }
  function logo(size) {
    return '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-label="Pido y Ido"><path d="M24 4C12.4 4 4 11.6 4 21c0 5.4 2.8 10.2 7.3 13.3L8.5 44l10.7-5.7c1.5.3 3.1.5 4.8.5 11.6 0 20-7.6 20-17.4S35.6 4 24 4z" fill="#FF6B2C"/><g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="26" r="4.2"/><circle cx="33" cy="26" r="4.2"/><path d="M15 26l5.5-7h6.5l6 7M19 19h-4M27 19l1.8-4H32"/></g></svg>';
  }
  function photo(src, cls, style) {
    return '<div class="ph ' + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '><span class="ph-ico">' + ic('fire', 26) + '</span><img src="' + esc(src) + '" alt="" loading="lazy" onerror="this.classList.add(\'broken\')"></div>';
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
      dishes: [
        { id: 'picada', name: 'Picada para dos', desc: 'Carne, chorizo, morcilla, papa criolla y arepa', price: 38000, img: IMG.pincho, top: true },
        { id: 'pincho', name: 'Pincho de res', desc: 'Con papa salada y ají', price: 9000, img: IMG.carne },
        { id: 'chorizo', name: 'Chorizo con arepa', desc: 'Chorizo santarrosano y arepa asada', price: 8000, img: IMG.arepa },
        { id: 'emp', name: 'Empanadas x3', desc: 'De pipián o de carne', price: 7500, img: IMG.emp },
        { id: 'jugo', name: 'Jugo de maracuyá', desc: 'En agua o en leche', price: 5000, img: IMG.jugo }
      ] }
  ];
  var CATS = [['Empanadas', IMG.emp], ['Asados', IMG.carne], ['Arepas', IMG.arepa], ['Hamburguesas', IMG.burger], ['Pizza', IMG.pizza], ['Jugos', IMG.jugo]];
  function R(id) { for (var i = 0; i < RESTAURANTS.length; i++) if (RESTAURANTS[i].id === id) return RESTAURANTS[i]; return RESTAURANTS[0]; }

  function seed() {
    var t = now();
    var mk = function (o) { o.subtotal = o.items.reduce(function (a, i) { return a + i.price * i.qty; }, 0); o.total = o.subtotal + (o.fee || 0); return o; };
    return {
      v: 2,
      user: { name: 'Luz Marina', phone: '3100000000', address: 'Barrio El Centro, dos casas después de la iglesia, puerta azul' },
      open: { llanero: true, plaza: true, rosa: true },
      ratings: {},
      cart: { restId: null, items: {}, mode: 'dom' },
      co: { pay: 'ef', cash: 'exact', note: '', geo: null },
      nextId: 145,
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
  var KEY = 'pidoyido_demo_v2';
  var S;
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var s = JSON.parse(raw); if (s && s.v === 2) return s; } } catch (e) {}
    return seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  S = load();
  var ui = { cat: null, q: '', rtab: 'nuevos', bf: {}, rate: null, signup: null, choose: {}, lastRoute: '', installEvt: null };

  function order(id) { for (var i = 0; i < S.orders.length; i++) if (S.orders[i].id === id) return S.orders[i]; return null; }
  function rider(id) { return S.riders[id] || null; }
  function restRating(r) { var x = S.ratings[r.id]; return x ? x : { rating: r.rating, count: r.count }; }
  function ratingTxt(r) { var x = restRating(r); return x.rating.toFixed(1).replace('.', ',') + ' (' + x.count + ')'; }
  function riderBusy(id) { return S.orders.some(function (o) { return o.riderId === id && o.status === 'en_camino'; }); }
  function cartLines() {
    if (!S.cart.restId) return [];
    var r = R(S.cart.restId);
    return r.dishes.filter(function (d) { return S.cart.items[d.id] > 0; }).map(function (d) { return { id: d.id, name: d.name, price: d.price, qty: S.cart.items[d.id], img: d.img }; });
  }
  function cartCount() { return cartLines().reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartSubtotal() { return cartLines().reduce(function (a, l) { return a + l.qty * l.price; }, 0); }
  function cartFee() { return S.cart.restId && S.cart.mode === 'dom' ? R(S.cart.restId).fee : 0; }

  // ---------- UI helpers ----------
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function go(path) { if (location.hash === '#' + path) render(); else location.hash = path; }
  function sheet(html) {
    var root = document.getElementById('sheet-root');
    if (!html) { root.innerHTML = ''; return; }
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
      rest: [['pedidos', 'receipt', 'Pedidos', '/rest'], ['riders', 'bike', 'Domiciliarios', '/rest/domiciliarios'], ['bolsa', 'users', 'Bolsa', '/rest/bolsa'], ['salir', 'swap', 'Cambiar rol', '/']],
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
  var STATUS_TXT = { recibido: 'Recibido', preparando: 'Preparando', listo: 'Listo', en_camino: 'En camino', entregado: 'Entregado', rechazado: 'Rechazado', cancelado: 'Cancelado' };
  function statusBadge(o) {
    var cls = { recibido: 'orange', preparando: 'amber', listo: 'amber', en_camino: 'route', entregado: 'green', rechazado: 'red', cancelado: 'grey' }[o.status];
    var txt = o.status === 'listo' ? (o.mode === 'rec' ? 'Listo para recoger' : 'Listo') : STATUS_TXT[o.status];
    return '<span class="badge ' + cls + '">' + txt + '</span>';
  }
  function payTxt(o) {
    if (o.pay === 'ef') return 'Efectivo ' + fmt(o.total) + (o.cashGiven > o.total ? ' · paga con ' + fmt(o.cashGiven) + ' · vueltas ' + fmt(o.cashGiven - o.total) : ' · exacto');
    return (o.pay === 'nequi' ? 'Nequi ' : 'Daviplata ') + fmt(o.total) + ' · transferencia';
  }
  function itemsTxt(o) { return o.items.map(function (i) { return i.qty + '× ' + i.name; }).join(', '); }

  // ---------- Screens: start ----------
  function scrStart() {
    var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var install = '';
    if (!standalone) {
      install = '<div class="card mt16"><div class="row top"><div class="icon-btn green">' + ic('install', 20) + '</div><div class="grow"><div class="b">Instálala como app</div>' +
        (ui.installEvt ? '<div class="small muted mt4">Queda en tu pantalla de inicio, como cualquier app.</div><button class="btn btn-green btn-sm mt8" data-a="install">Instalar Pido y Ido</button>'
          : ios ? '<div class="small muted mt4">En Safari toca <b>Compartir</b> (el cuadro con la flecha) y luego <b>Agregar a inicio</b>.</div>'
            : '<div class="small muted mt4">En Chrome abre el menú <b>⋮</b> y toca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</div>') +
        '</div></div></div>';
    }
    var roles = [
      ['/inicio', 'bag', '#FFE9DE', '#B9440F', 'Quiero pedir comida', 'Cliente · restaurantes, carrito, pago y seguimiento'],
      ['/rest', 'store', '#E3EFE8', '#1F4D3A', 'Tengo un restaurante', 'Recibir pedidos y enviarlos con tu domiciliario'],
      ['/dom', 'bike', '#FFF1E0', '#8A4A00', 'Soy domiciliario', 'Bolsa de domiciliarios y pedidos por WhatsApp'],
      ['/promo', 'qr', '#EAE6F5', '#4A3C7A', 'Recomiendo y gano', 'Tu enlace y QR de promotor, y tus ganancias']
    ];
    return '<div class="start-hero"><div class="row">' + logo(52) + '<div><div class="num" style="font-size:24px;letter-spacing:-.4px">Pido y Ido</div><div class="small" style="opacity:.85">Villanueva, Casanare</div></div></div>' +
      '<h1 class="mt20" style="font-size:26px;line-height:1.15;letter-spacing:-.4px">Pide comida del pueblo y te la llevan a la casa.</h1>' +
      '<p class="small" style="opacity:.85;margin:8px 0 0">Prototipo de demostración. Todo funciona, pero los datos quedan solo en este celular y no se cobra nada.</p></div>' +
      '<div class="screen" style="min-height:0;padding-top:20px"><div class="t-h2" style="margin-bottom:12px">¿Cómo quieres entrar?</div>' +
      roles.map(function (r) {
        return '<a class="role" href="#' + r[0] + '"><div class="ic" style="background:' + r[2] + ';color:' + r[3] + '">' + ic(r[1], 26) + '</div><div class="grow"><div class="t-h3">' + r[4] + '</div><div class="small muted">' + r[5] + '</div></div>' + ic('right', 20) + '</a>';
      }).join('') + install +
      '<button class="btn btn-ghost btn-block mt16" data-a="resetAsk">' + ic('refresh', 18) + ' Reiniciar datos de demo</button></div>';
  }

  // ---------- Customer ----------
  function restCard(r) {
    var open = S.open[r.id];
    return '<a class="rest-card' + (open ? '' : ' closed') + '" href="#/r/' + r.id + '"><div style="position:relative">' + photo(r.img, '', 'height:168px;width:100%') +
      (r.fee === 0 ? '<span class="over" style="left:12px;top:12px;background:var(--green);color:#fff">Domicilio gratis</span>' : '') +
      '<span class="over" style="right:12px;bottom:12px;background:#fff">' + r.eta + '</span>' +
      (open ? '' : '<div class="closed-veil"><span>Cerrado ahora</span></div>') +
      '</div><div style="padding:12px 14px"><div class="row between"><div class="t-h3 ellipsis">' + r.name + '</div><div class="small b" style="flex:none"><span style="color:var(--orange)">★</span> ' + ratingTxt(r) + '</div></div>' +
      '<div class="small muted mt4">' + r.sub + ' · Mín. ' + fmt(r.min) + (r.fee ? ' · Domicilio ' + fmt(r.fee) : '') + '</div></div></a>';
  }
  function cartBar(above) {
    var n = cartCount(); if (!n) return '';
    return '<div class="cta-wrap' + (above ? ' above-tabs' : '') + '"><a class="cart-bar" href="#/confirmar"><span class="c">' + n + '</span><span class="grow">Ver carrito · ' + R(S.cart.restId).short + '</span><span>' + fmt(cartSubtotal()) + '</span></a></div>';
  }
  function scrInicio() {
    var last = S.orders.filter(function (o) { return o.mine && o.status === 'entregado'; })[0];
    var active = S.orders.filter(function (o) { return o.mine && ['recibido', 'preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0; })[0];
    var list = RESTAURANTS.filter(function (r) { return !ui.cat || r.cats.indexOf(ui.cat) >= 0; });
    var openN = RESTAURANTS.filter(function (r) { return S.open[r.id]; }).length;
    var h = '<div class="screen has-tabs' + (cartCount() ? ' has-cta' : '') + '">' +
      '<div class="row">' + logo(40) + '<button class="grow" style="text-align:left" data-a="editAddress"><div class="xs muted">Entregar en</div><div class="b row" style="gap:4px;font-size:15px"><span class="ellipsis">' + esc(S.user.address.split(',')[0]) + ', Villanueva</span>' + ic('down', 16) + '</div></button>' +
      '<a class="icon-btn" href="#/confirmar" aria-label="Carrito" style="position:relative">' + ic('bag', 20) + (cartCount() ? '<span style="position:absolute;top:-2px;right:-2px;background:var(--cta);color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">' + cartCount() + '</span>' : '') + '</a></div>' +
      '<h1 class="t-title mt16" style="font-size:28px">¿Qué se te antoja hoy, ' + esc(first(S.user.name)) + '?</h1>' +
      '<a class="search mt16" href="#/buscar">' + ic('search', 20) + '<span class="muted">Busca empanadas, pizza, arepas…</span></a>';
    if (active) {
      h += '<a class="card mt16 row" href="#/pedido/' + active.id + '" style="border:2px solid var(--green)"><span class="pulse"></span><div class="grow"><div class="b">Pedido #' + active.id + ' · ' + R(active.restId).short + '</div><div class="small muted">' + statusLine(active) + '</div></div>' + ic('right', 20) + '</a>';
    }
    h += '<div class="cats mt16">' + CATS.map(function (c) {
      return '<button class="cat' + (ui.cat === c[0] ? ' on' : '') + '" data-a="cat" data-v="' + c[0] + '">' + photo(c[1]) + '<span>' + c[0] + '</span></button>';
    }).join('') + '</div>';
    if (last && !ui.cat) {
      h += '<div class="t-h2 mt20">Pedir de nuevo</div><div class="card mt12 row">' + photo(last.items[0] && R(last.restId).dishes.filter(function (d) { return d.id === last.items[0].id; })[0] ? R(last.restId).dishes.filter(function (d) { return d.id === last.items[0].id; })[0].img : R(last.restId).img, 'thumb') +
        '<div class="grow"><div class="b ellipsis">' + R(last.restId).name + '</div><div class="small muted ellipsis">' + last.items.map(function (i) { return i.name; }).join(' + ') + ' · ' + fmt(last.total) + '</div></div>' +
        '<button class="btn btn-soft btn-sm" data-a="reorder" data-id="' + last.id + '">Repetir</button></div>';
    }
    h += '<div class="row between mt24"><div class="t-h2">' + (ui.cat ? ui.cat : 'Cerca de ti') + '</div><div class="small muted">' + (ui.cat ? '<button class="link" data-a="cat" data-v="">Ver todos</button>' : openN + ' abiertos') + '</div></div><div class="mt12">' +
      (list.length ? list.map(restCard).join('') : '<div class="empty">Todavía no hay restaurantes con ' + ui.cat + '.</div>') + '</div></div>';
    return h + cartBar(true) + tabs('cliente', 'inicio');
  }
  function searchResults() {
    var q = ui.q.trim().toLowerCase();
    if (!q) return '<div class="small muted mt16">Prueba: carne, pizza, empanadas, jugo…</div>' + '<div class="chips mt12">' + ['Carne', 'Pizza', 'Empanadas', 'Hamburguesa', 'Jugo'].map(function (s) { return '<button class="chip" data-a="qset" data-v="' + s + '">' + s + '</button>'; }).join('') + '</div>';
    var out = [];
    RESTAURANTS.forEach(function (r) {
      if (r.name.toLowerCase().indexOf(q) >= 0 || r.sub.toLowerCase().indexOf(q) >= 0) out.push('<a class="list-row" href="#/r/' + r.id + '">' + photo(r.img, 'thumb') + '<div class="grow"><div class="b">' + r.name + '</div><div class="small muted">Restaurante · ' + r.eta + '</div></div>' + ic('right', 18) + '</a>');
      r.dishes.forEach(function (d) {
        if ((d.name + ' ' + d.desc).toLowerCase().indexOf(q) >= 0) out.push('<a class="list-row" href="#/r/' + r.id + '">' + photo(d.img, 'thumb') + '<div class="grow"><div class="b">' + d.name + '</div><div class="small muted">' + r.short + ' · ' + fmt(d.price) + '</div></div>' + ic('right', 18) + '</a>');
      });
    });
    return out.length ? '<div class="card mt16" style="padding:4px 14px">' + out.join('') + '</div>' : '<div class="empty">No encontramos “' + esc(ui.q) + '”.</div>';
  }
  function scrBuscar() {
    return '<div class="screen has-tabs">' + topbar('Buscar') + '<label class="search">' + ic('search', 20) + '<input id="q" type="search" placeholder="Busca empanadas, pizza, arepas…" value="' + esc(ui.q) + '" data-live="q" autocomplete="off"></label><div id="results">' + searchResults() + '</div></div>' + cartBar(true) + tabs('cliente', 'buscar');
  }
  function scrMenu(id, query) {
    var r = R(id);
    if (query && query.p) { S.ref = { slug: query.p, restId: id, at: now() }; save(); }
    var open = S.open[r.id];
    var mode = S.cart.restId === r.id ? S.cart.mode : 'dom';
    var h = '<div class="screen flush' + (cartCount() ? ' has-cta' : '') + '"><div class="hero">' + photo(r.img, '', 'height:232px;width:100%') +
      '<a class="icon-btn back" href="#/inicio" aria-label="Volver">' + ic('back', 22) + '</a><button class="icon-btn fav" data-a="fav" aria-label="Favorito">' + ic('heart', 20) + '</button></div>' +
      '<div class="card raised info-card"><h1 class="t-title" style="font-size:24px">' + r.name + '</h1><div class="small muted mt4"><span style="color:var(--orange)">★</span> ' + ratingTxt(r) + ' · ' + r.eta + ' · Mín. ' + fmt(r.min) + '</div>' +
      '<div class="seg mt12"><button class="' + (mode === 'dom' ? 'on' : '') + '" data-a="mode" data-v="dom" data-r="' + r.id + '">Domicilio · ' + (r.fee ? fmt(r.fee) : 'gratis') + '</button><button class="' + (mode === 'rec' ? 'on' : '') + '" data-a="mode" data-v="rec" data-r="' + r.id + '">Recoger · ' + r.pickup + '</button></div>' +
      (open ? '' : '<div class="note amber mt12"><b>Cerrado ahora.</b> Puedes mirar el menú, pero no recibe pedidos.</div>') +
      (S.ref && S.ref.restId === r.id ? '<div class="note green mt12">Llegaste con el enlace de un vecino que recomienda este restaurante.</div>' : '') +
      '</div><div class="pad"><div class="t-h2 mt20">Lo más pedido</div><div class="mt12">';
    h += r.dishes.map(function (d) {
      var q = S.cart.restId === r.id ? (S.cart.items[d.id] || 0) : 0;
      return '<div class="dish"><div class="grow">' + (d.top ? '<span class="badge orange" style="margin-bottom:6px">Más pedido</span>' : '') + '<div class="b" style="font-size:15px">' + d.name + '</div><div class="small muted mt4">' + d.desc + '</div><div class="b mt8">' + fmt(d.price) + '</div></div>' +
        '<div class="ph" style="width:96px;height:96px"><div class="imgwrap">' + '<img src="' + esc(d.img) + '" alt="" loading="lazy" onerror="this.classList.add(\'broken\')" style="width:100%;height:100%;object-fit:cover">' + '</div>' +
        (q ? '<div class="qty has"><button data-a="dec" data-r="' + r.id + '" data-d="' + d.id + '" aria-label="Quitar">' + ic('minus', 18) + '</button><span class="n">' + q + '</span><button data-a="add" data-r="' + r.id + '" data-d="' + d.id + '" aria-label="Agregar">' + ic('plus', 18) + '</button></div>'
          : '<div class="qty"><button data-a="add" data-r="' + r.id + '" data-d="' + d.id + '" aria-label="Agregar ' + esc(d.name) + '">' + ic('plus', 20) + '</button></div>') +
        '</div></div>';
    }).join('');
    h += '</div><div class="small muted mt16 center">' + r.address + '</div></div></div>';
    return h + cartBar(false);
  }
  function cashOptions(total) {
    var bills = [10000, 20000, 50000, 100000, 200000].filter(function (b) { return b > total; }).slice(0, 2);
    return [['exact', 'Exacto']].concat(bills.map(function (b) { return [String(b), fmt(b)]; }));
  }
  function scrConfirmar() {
    var lines = cartLines();
    if (!lines.length) {
      return '<div class="screen">' + topbar('Tu carrito', '/inicio') + '<div class="empty"><div class="ic">' + ic('bag', 28) + '</div><div class="b" style="color:var(--text)">Tu carrito está vacío</div><div class="small mt4">Elige un restaurante y agrega algo rico.</div><a class="btn btn-primary mt16" href="#/inicio">Ver restaurantes</a></div></div>';
    }
    var r = R(S.cart.restId), sub = cartSubtotal(), fee = cartFee(), total = sub + fee, co = S.co;
    var short = r.min - sub;
    var cashVal = co.cash === 'exact' ? total : +co.cash;
    if (co.cash !== 'exact' && cashVal <= total) { co.cash = 'exact'; cashVal = total; }
    var h = '<div class="screen has-cta">' + topbar('Confirmar pedido', '/r/' + r.id, r.name);
    if (S.cart.mode === 'dom') {
      h += '<div class="card"><div class="row b" style="gap:8px"><span class="orange">' + ic('pin', 18) + '</span>¿Dónde te lo llevamos?</div>' +
        '<textarea class="input mt12" id="addr" data-m="user.address" rows="2" placeholder="Barrio, calle y cómo llegar (ej.: dos casas después de la iglesia, puerta azul)">' + esc(S.user.address) + '</textarea>' +
        '<button class="dashed-btn mt8' + (co.geo ? ' done' : '') + '" data-a="geo">' + ic(co.geo ? 'check' : 'map', 18) + (co.geo ? 'Ubicación guardada en el mapa' : 'Poner pin en el mapa (opcional)') + '</button>' +
        '<div class="row mt12" style="gap:10px"><div class="grow"><label class="label" for="nm">Tu nombre</label><input class="input" id="nm" data-m="user.name" value="' + esc(S.user.name) + '" autocomplete="name"></div>' +
        '<div class="grow"><label class="label" for="ph">Celular</label><input class="input" id="ph" data-m="user.phone" inputmode="tel" value="' + esc(S.user.phone) + '" autocomplete="tel"></div></div>' +
        '<label class="label mt12" for="note">Nota para la cocina</label><input class="input" id="note" data-m="co.note" value="' + esc(co.note) + '" placeholder="Ej.: carne término medio, sin ají"></div>';
    } else {
      h += '<div class="card"><div class="row b" style="gap:8px"><span class="orange">' + ic('store', 18) + '</span>Recoges en el restaurante</div><div class="small muted mt4">' + r.address + ' · listo en ' + r.pickup + '</div>' +
        '<div class="row mt12" style="gap:10px"><div class="grow"><label class="label" for="nm">Tu nombre</label><input class="input" id="nm" data-m="user.name" value="' + esc(S.user.name) + '"></div>' +
        '<div class="grow"><label class="label" for="ph">Celular</label><input class="input" id="ph" data-m="user.phone" inputmode="tel" value="' + esc(S.user.phone) + '"></div></div>' +
        '<label class="label mt12" for="note">Nota para la cocina</label><input class="input" id="note" data-m="co.note" value="' + esc(co.note) + '" placeholder="Ej.: sin cebolla"></div>';
    }
    h += '<div class="card mt12"><div class="t-h3" style="margin-bottom:12px">¿Cómo pagas?</div>' +
      [['ef', 'Efectivo', 'Pagas al recibir'], ['nequi', 'Nequi', 'Transfieres y envías el comprobante'], ['davi', 'Daviplata', 'Transfieres y envías el comprobante']].map(function (p) {
        var on = co.pay === p[0];
        var subt = p[0] === 'ef' && on ? (cashVal > total ? 'Pagas con ' + fmt(cashVal) + ' · vueltas ' + fmt(cashVal - total) : 'Pagas exacto') : p[2];
        return '<button class="radio-row' + (on ? ' on' : '') + '" data-a="pay" data-v="' + p[0] + '"><span class="ring"></span><span class="grow"><span class="b" style="display:block">' + p[1] + '</span><span class="small muted">' + subt + '</span></span></button>';
      }).join('');
    if (co.pay === 'ef') {
      h += '<div class="label mt16">¿Con cuánto pagas?</div><div class="chips">' + cashOptions(total).map(function (c) { return '<button class="chip' + (co.cash === c[0] ? ' on' : '') + '" data-a="cash" data-v="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        (cashVal > total ? '<div class="note green mt12 row between b"><span>Tus vueltas</span><span>' + fmt(cashVal - total) + '</span></div>' : '');
    } else {
      h += '<div class="note grey mt12">Después de hacer el pedido te mostramos el número de ' + (co.pay === 'nequi' ? 'Nequi' : 'Daviplata') + ' del restaurante.</div>';
    }
    h += '</div><div class="card mt12">' + lines.map(function (l) { return '<div class="row between small" style="padding:3px 0"><span>' + l.qty + ' × ' + l.name + '</span><span>' + fmt(l.qty * l.price) + '</span></div>'; }).join('') +
      '<div class="row between small" style="padding:3px 0"><span class="' + (fee ? '' : 'green b') + '">' + (S.cart.mode === 'dom' ? 'Domicilio' : 'Recoges tú') + '</span><span class="' + (fee ? '' : 'green b') + '">' + (fee ? fmt(fee) : 'Gratis') + '</span></div>' +
      '<div class="divider dashed"></div><div class="row between"><span class="t-h3">Total</span><span class="num" style="font-size:18px">' + fmt(total) + '</span></div></div>' +
      (short > 0 ? '<div class="note amber mt12">El pedido mínimo es ' + fmt(r.min) + '. Te faltan <b>' + fmt(short) + '</b>. <a class="b" href="#/r/' + r.id + '" style="text-decoration:underline">Agregar más</a></div>' : '') +
      '<button class="btn btn-ghost btn-block mt8" data-a="clearCart">Vaciar carrito</button>';
    h += '</div><div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="placeOrder"' + (short > 0 || !S.open[r.id] ? ' disabled' : '') + '>' + (S.open[r.id] ? 'Hacer pedido · ' + fmt(total) : 'Restaurante cerrado') + '</button></div>';
    return h;
  }
  function statusLine(o) {
    var r = R(o.restId);
    if (o.status === 'recibido') return 'Esperando que ' + r.short + ' acepte';
    if (o.status === 'preparando') return 'Lo están preparando';
    if (o.status === 'listo') return o.mode === 'rec' ? 'Listo para recoger' : 'Listo, buscando quién lo lleva';
    if (o.status === 'en_camino') return 'Va en camino';
    if (o.status === 'entregado') return 'Entregado ' + ago(o.deliveredAt);
    if (o.status === 'rechazado') return 'El restaurante no pudo aceptarlo';
    return STATUS_TXT[o.status];
  }
  function etaInfo(o) {
    if (o.status === 'recibido') return ['Esperando', 'Que el restaurante acepte tu pedido'];
    if (o.status === 'preparando') { var left = Math.max(5, Math.round((o.etaMin || 30) - (now() - o.acceptedAt) / 60000)); return [left + ' min', o.mode === 'rec' ? 'Para que esté listo' : 'Aprox. para que llegue']; }
    if (o.status === 'listo') return o.mode === 'rec' ? ['¡Listo!', 'Ya puedes ir a recogerlo'] : ['10–15 min', 'Ya está listo, sale en un momento'];
    if (o.status === 'en_camino') { var m = Math.max(2, 12 - Math.round((now() - (o.sentAt || now())) / 60000)); return [Math.max(1, m - 4) + '–' + m + ' min', 'Tu pedido va en camino']; }
    if (o.status === 'entregado') return ['Entregado', 'A las ' + hora(o.deliveredAt)];
    return ['—', statusLine(o)];
  }
  function scrPedido(id) {
    var o = order(id);
    if (!o) return '<div class="screen">' + topbar('Pedido', '/pedidos') + '<div class="empty">No encontramos este pedido.</div></div>';
    var r = R(o.restId), e = etaInfo(o);
    var steps = o.mode === 'rec' ? ['Recibido', 'Preparando', 'Listo', 'Entregado'] : ['Recibido', 'Preparando', 'En camino', 'Entregado'];
    var idx = { recibido: 0, preparando: 1, listo: o.mode === 'rec' ? 2 : 1, en_camino: 2, entregado: 3 }[o.status];
    var h = '<div class="screen flush has-tabs"><div class="status-head"><div class="row between"><div class="small" style="opacity:.85">Pedido #' + o.id + ' · ' + r.name + '</div><a href="#/pedidos" class="small b" style="opacity:.9">Mis pedidos</a></div>';
    if (o.status === 'rechazado') {
      h += '<h1 class="mt12" style="font-size:28px">No pudieron aceptar tu pedido</h1><div class="small mt8" style="opacity:.85">' + esc(o.rejectReason || 'El restaurante está muy lleno ahora.') + ' No se cobró nada.</div></div>' +
        '<div class="pad" style="margin-top:-40px"><div class="card raised"><a class="btn btn-primary btn-block" href="#/inicio">Pedir en otro restaurante</a></div></div></div>' + tabs('cliente', 'pedidos');
      return h;
    }
    h += '<div class="small mt12" style="opacity:.85">' + (o.status === 'en_camino' || o.status === 'preparando' ? 'Llega en' : '') + '</div><div class="eta">' + e[0] + '</div><div style="opacity:.9">' + e[1] + '</div></div>';
    h += '<div class="pad" style="margin-top:-44px"><div class="card raised"><div class="progress">' + steps.map(function (s, i) {
      var cls = i < idx || o.status === 'entregado' ? 'done' : i === idx ? 'active' : '';
      return '<div><div class="bar ' + cls + '"><i style="width:' + (cls === 'done' ? '100%' : cls === 'active' ? '50%' : '0') + '"></i></div><div class="lbl' + (i === idx ? ' on' : '') + '">' + s + '</div></div>';
    }).join('') + '</div>';
    var rd = o.riderId && o.riderId !== 'yo' ? rider(o.riderId) : null;
    if (o.status === 'en_camino' && rd) {
      var c = avColor(rd.id);
      h += '<div class="divider"></div><div class="row"><div class="avatar" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(rd.name) + '</div><div class="grow"><div class="b">' + esc(rd.name) + '</div><div class="small muted">Domiciliario del restaurante · ' + esc((rd.vehicle || 'Moto').toLowerCase()) + '</div></div>' +
        '<a class="icon-btn green" href="' + waLink(rd.phone, 'Hola ' + first(rd.name) + ', soy ' + S.user.name + ' (pedido #' + o.id + ').') + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ic('msg', 20) + '</a><a class="icon-btn green" href="tel:' + rd.phone + '" aria-label="Llamar">' + ic('phone', 20) + '</a></div>';
    } else if (o.status === 'en_camino' && o.riderId === 'yo') {
      h += '<div class="divider"></div><div class="row"><div class="avatar">' + ic('store', 22) + '</div><div class="grow"><div class="b">Lo lleva el restaurante</div><div class="small muted">' + r.name + '</div></div><a class="icon-btn green" href="tel:' + r.phone + '">' + ic('phone', 20) + '</a></div>';
    }
    h += '</div>';
    if (o.status !== 'entregado') {
      h += '<div class="pin-box mt12"><div class="b" style="color:var(--soft-t)">' + (o.mode === 'rec' ? 'Dale este código al recoger' : 'Dale este código a ' + (rd ? esc(callName(rd.name)) : 'quien te entregue') + ' al recibir') + '</div>' +
        '<div class="pin">' + o.pin.split('').map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="small" style="color:var(--soft-t)">Así sabemos que el pedido llegó a la persona correcta.</div></div>';
    }
    if (o.pay !== 'ef' && o.status !== 'entregado') {
      h += '<div class="card mt12"><div class="b">Paga con ' + (o.pay === 'nequi' ? 'Nequi' : 'Daviplata') + '</div><div class="small muted mt4">Transfiere <b style="color:var(--text)">' + fmt(o.total) + '</b> al ' + r.nequi + ' (' + r.name + ') y envía el comprobante.</div>' +
        '<a class="btn btn-green btn-sm btn-block mt12" target="_blank" rel="noopener" href="' + waLink(r.phone, 'Hola, envío el comprobante del pedido #' + o.id + ' por ' + fmt(o.total) + '.') + '">' + ic('msg', 18) + ' Enviar comprobante por WhatsApp</a></div>';
    }
    h += '<div class="card mt12 small">' + (o.pay === 'ef' ? '<div class="row between" style="padding:3px 0"><span class="muted">Pagas en efectivo</span><span class="b">' + fmt(o.total) + '</span></div>' +
      (o.cashGiven > o.total ? '<div class="row between" style="padding:3px 0"><span class="muted">Ten listo</span><span class="b">' + fmt(o.cashGiven) + ' · vueltas ' + fmt(o.cashGiven - o.total) + '</span></div>' : '') : '<div class="row between" style="padding:3px 0"><span class="muted">Total</span><span class="b">' + fmt(o.total) + '</span></div>') +
      '<div class="row between" style="padding:3px 0"><span class="muted">' + (o.mode === 'rec' ? 'Recoges en' : 'Entrega') + '</span><span class="b" style="text-align:right;max-width:65%">' + esc(o.mode === 'rec' ? r.address : o.customer.address) + '</span></div>' +
      '<div class="row between" style="padding:3px 0"><span class="muted">Pediste</span><span style="text-align:right;max-width:65%">' + esc(itemsTxt(o)) + '</span></div></div>';
    if (o.status === 'entregado') {
      h += o.rating ? '<div class="card mt12 center"><div class="small muted">Tu calificación</div><div style="color:var(--orange);font-size:24px;letter-spacing:2px">' + '★★★★★'.slice(0, o.rating) + '<span style="color:#E9E3DB">' + '★★★★★'.slice(o.rating) + '</span></div></div>'
        : '<a class="btn btn-primary btn-block mt12" href="#/calificar/' + o.id + '">Calificar pedido</a>';
      h += '<button class="btn btn-outline btn-block mt12" data-a="reorder" data-id="' + o.id + '">Pedir lo mismo otra vez</button>';
    }
    // demo helper
    if (['recibido', 'preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0) {
      var next = o.status === 'en_camino' && o.riderId && o.riderId !== 'yo'
        ? '<a class="btn btn-outline btn-block mt8" href="#/wa/' + o.id + '">Abrir el WhatsApp del domiciliario</a>'
        : '<a class="btn btn-outline btn-block mt8" href="#/rest?r=' + o.restId + '">Abrir el panel del restaurante</a>';
      h += '<div class="demo-bar mt16"><b>Modo demo</b>En la vida real el restaurante y el domiciliario hacen el siguiente paso desde su propio celular. Aquí lo puedes hacer tú:' + next + '</div>';
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
    var tags = ['Llegó caliente', 'Buena porción', 'Rápido', 'Bien empacado'];
    return '<div class="screen has-cta center"><div class="big-check">' + ic('check', 44, { sw: 2.6 }) + '</div>' +
      '<h1 class="t-title mt16">¡Buen provecho, ' + esc(first(o.customer.name)) + '!</h1><div class="muted mt8">Tu pedido de ' + r.name + ' llegó a las ' + hora(o.deliveredAt || now()) + '.</div>' +
      '<div class="card mt20">' + photo(d ? d.img : r.img, '', 'height:150px;border-radius:12px') + '<div class="t-h3 mt16">¿Qué tal estuvo la comida?</div>' +
      '<div class="stars mt8">' + [1, 2, 3, 4, 5].map(function (n) { return '<button data-a="star" data-v="' + n + '" aria-label="' + n + ' estrellas" style="color:' + (n <= ui.rate.stars ? '#FF6B2C' : '#E9E3DB') + '">' + ic('star', 34, { fill: true, sw: 1 }) + '</button>'; }).join('') + '</div>' +
      '<div class="chips mt16" style="justify-content:center">' + tags.map(function (t) { return '<button class="chip g sm' + (ui.rate.tags[t] ? ' on' : '') + '" data-a="tag" data-v="' + t + '">' + t + '</button>'; }).join('') + '</div></div>' +
      '</div><div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="sendRating" data-id="' + id + '"' + (ui.rate.stars ? '' : ' disabled') + '>Enviar calificación</button><a class="btn btn-ghost btn-block" href="#/inicio" style="height:44px">Ahora no</a></div>';
  }
  function orderRow(o, href) {
    var r = R(o.restId);
    return '<a class="list-row" href="' + href + '">' + photo(r.img, 'thumb') + '<div class="grow"><div class="row between"><span class="b">#' + o.id + ' · ' + r.short + '</span>' + statusBadge(o) + '</div><div class="small muted ellipsis mt4">' + esc(itemsTxt(o)) + ' · ' + fmt(o.total) + '</div><div class="xs muted">' + ago(o.createdAt) + '</div></div></a>';
  }
  function scrPedidos() {
    var mine = S.orders.filter(function (o) { return o.mine; });
    var act = mine.filter(function (o) { return ['recibido', 'preparando', 'listo', 'en_camino'].indexOf(o.status) >= 0; });
    var past = mine.filter(function (o) { return act.indexOf(o) < 0; });
    return '<div class="screen has-tabs">' + topbar('Mis pedidos') +
      (act.length ? '<div class="t-h3">En curso</div><div class="card mt8" style="padding:4px 14px">' + act.map(function (o) { return orderRow(o, '#/pedido/' + o.id); }).join('') + '</div>' : '') +
      '<div class="t-h3 mt20">Anteriores</div>' + (past.length ? '<div class="card mt8" style="padding:4px 14px">' + past.map(function (o) { return orderRow(o, '#/pedido/' + o.id); }).join('') + '</div>' : '<div class="empty">Aún no tienes pedidos anteriores.</div>') +
      '</div>' + tabs('cliente', 'pedidos');
  }
  function scrPerfil() {
    var c = avColor('luz');
    return '<div class="screen has-tabs">' + topbar('Perfil') +
      '<div class="card row"><div class="avatar" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(S.user.name) + '</div><div class="grow"><div class="t-h3">' + esc(S.user.name) + '</div><div class="small muted">' + phoneFmt(S.user.phone) + ' · Villanueva</div></div></div>' +
      '<div class="card mt12"><div class="field"><label class="label" for="pn">Nombre</label><input class="input" id="pn" data-m="user.name" value="' + esc(S.user.name) + '"></div>' +
      '<div class="field"><label class="label" for="pp">Celular / WhatsApp</label><input class="input" id="pp" data-m="user.phone" inputmode="tel" value="' + esc(S.user.phone) + '"></div>' +
      '<div class="field"><label class="label" for="pa">Dirección</label><textarea class="input" id="pa" data-m="user.address" rows="2">' + esc(S.user.address) + '</textarea></div>' +
      '<button class="btn btn-green btn-sm btn-block mt12" data-a="saveProfile">Guardar</button></div>' +
      '<div class="card mt12" style="padding:4px 14px">' +
      '<a class="menu-row" href="#/promo"><span class="mi">' + ic('qr', 20) + '</span><span class="grow">Recomienda y gana</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/dom"><span class="mi">' + ic('bike', 20) + '</span><span class="grow">Quiero ser domiciliario</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/rest"><span class="mi">' + ic('store', 20) + '</span><span class="grow">Panel del restaurante</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/"><span class="mi">' + ic('swap', 20) + '</span><span class="grow">Cambiar de rol</span>' + ic('right', 18) + '</a>' +
      '<button class="menu-row" data-a="resetAsk"><span class="mi" style="background:#FDE8E6;color:#A1291B">' + ic('refresh', 20) + '</span><span class="grow">Reiniciar datos de demo</span></button></div>' +
      '<div class="xs muted center mt16">Pido y Ido · prototipo de demostración</div></div>' + tabs('cliente', 'perfil');
  }

  // ---------- Restaurant ----------
  function restHeader(r) {
    var open = S.open[r.id];
    return '<div class="row">' + photo(r.img, 'thumb s44') + '<button class="grow" style="text-align:left" data-a="pickRest"><div class="xs muted">Panel del restaurante</div><div class="b row" style="gap:4px"><span class="ellipsis">' + r.name + '</span>' + ic('down', 16) + '</div></button>' +
      '<button class="toggle" data-a="toggleOpen" style="background:' + (open ? 'var(--gtint)' : 'var(--track)') + ';color:' + (open ? 'var(--green)' : 'var(--muted)') + '">' + (open ? 'Abierto' : 'Cerrado') +
      '<span class="tr" style="background:' + (open ? 'var(--green)' : '#C9C1B7') + ';--k:' + (open ? '19px' : '3px') + '"></span></button></div>';
  }
  function scrRest(query) {
    if (query && query.r && RESTAURANTS.some(function (x) { return x.id === query.r; })) { S.restId = query.r; save(); }
    var r = R(S.restId);
    var mine = S.orders.filter(function (o) { return o.restId === r.id; });
    var groups = {
      nuevos: mine.filter(function (o) { return o.status === 'recibido'; }),
      preparando: mine.filter(function (o) { return o.status === 'preparando' || o.status === 'listo'; }),
      camino: mine.filter(function (o) { return o.status === 'en_camino'; }),
      hechos: mine.filter(function (o) { return ['entregado', 'rechazado', 'cancelado'].indexOf(o.status) >= 0; })
    };
    var today = mine.filter(function (o) { return isToday(o.createdAt) && ['rechazado', 'cancelado'].indexOf(o.status) < 0; });
    var base = { llanero: [14, 412000], plaza: [9, 318000], rosa: [11, 276000] }[r.id];
    var h = '<div class="screen has-tabs">' + restHeader(r) +
      '<div class="stats mt16"><div class="stat"><div class="xs muted">Hoy</div><div class="v">' + (base[0] + today.length) + '</div><div class="xs muted">pedidos</div></div>' +
      '<div class="stat"><div class="xs muted">Ventas</div><div class="v">$' + Math.round((base[1] + today.reduce(function (a, o) { return a + o.total; }, 0)) / 1000) + 'k</div><div class="xs muted">COP</div></div>' +
      '<div class="stat"><div class="xs muted">Promedio</div><div class="v">24</div><div class="xs muted">min</div></div></div>' +
      (S.open[r.id] ? '' : '<div class="note amber mt12"><b>Estás cerrado.</b> Los clientes ven tu menú, pero no pueden pedir.</div>') +
      '<div class="chips scroll mt16">' + [['nuevos', 'Nuevos'], ['preparando', 'Preparando'], ['camino', 'En camino'], ['hechos', 'Entregados']].map(function (t) {
        var n = groups[t[0]].length;
        return '<button class="chip' + (ui.rtab === t[0] ? ' on' : '') + '" data-a="rtab" data-v="' + t[0] + '">' + t[1] + (n ? ' <span class="cnt">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div><div class="mt12">';
    var list = groups[ui.rtab];
    if (!list.length) {
      var emptyTxt = { nuevos: 'No hay pedidos nuevos. Cuando llegue uno, aparece aquí (y te avisamos por WhatsApp).', preparando: 'Nada en preparación.', camino: 'Ningún pedido en camino.', hechos: 'Todavía no hay pedidos terminados.' }[ui.rtab];
      h += '<div class="empty"><div class="ic">' + ic('receipt', 26) + '</div>' + emptyTxt + '</div>';
      if (ui.rtab === 'nuevos') h += '<div class="demo-bar"><b>Modo demo</b>Haz un pedido como cliente y vuelve aquí para aceptarlo.<a class="btn btn-outline btn-block mt8" href="#/r/' + r.id + '">Pedir como cliente</a></div>';
    }
    h += list.map(function (o) { return restOrderCard(o); }).join('');
    return h + '</div></div>' + tabs('rest', 'pedidos');
  }
  function restOrderCard(o) {
    var items = o.items.map(function (i) { return '<div class="row between" style="padding:2px 0"><span><b>' + i.qty + '×</b> ' + esc(i.name) + '</span><span>' + fmt(i.qty * i.price) + '</span></div>'; }).join('');
    var cust = '<div class="small mt8"><b>' + esc(o.customer.name) + '</b> · ' + (o.mode === 'rec' ? 'Recoge en el local' : esc(o.customer.address)) + '</div><div class="small mt4"><b>' + payTxt(o).split(' · ')[0] + '</b>' + (payTxt(o).indexOf(' · ') > 0 ? ' · ' + payTxt(o).split(' · ').slice(1).join(' · ') : '') + '</div>';
    var note = o.note ? '<div class="note grey mt8">Nota: ' + esc(o.note) + '</div>' : '';
    if (o.status === 'recibido') {
      return '<div class="order-card"><div class="oh"><span class="row" style="gap:8px"><span class="pulse"></span>Pedido nuevo · ' + ago(o.createdAt) + '</span><span>#' + o.id + '</span></div><div class="ob">' + items + note + '<div class="divider"></div>' + cust +
        '<div class="label mt12">Tiempo de preparación' + (o.mode === 'dom' ? ' y entrega' : '') + '</div><div class="chips">' + [20, 30, 45].map(function (m) { var on = (ui.choose['eta' + o.id] || 30) === m; return '<button class="chip sm' + (on ? ' on' : '') + '" data-a="etaPick" data-id="' + o.id + '" data-v="' + m + '">' + m + ' min</button>'; }).join('') + '</div>' +
        '<div class="row mt12" style="gap:10px"><button class="btn btn-outline" style="flex:1" data-a="reject" data-id="' + o.id + '">Rechazar</button><button class="btn btn-primary" style="flex:1.6" data-a="accept" data-id="' + o.id + '">Aceptar · ' + (ui.choose['eta' + o.id] || 30) + ' min</button></div></div></div>';
    }
    var head = '<div class="row between"><span class="b">#' + o.id + ' · ' + esc(first(o.customer.name)) + '</span>' + statusBadge(o) + '</div><div class="small muted mt4">' + esc(itemsTxt(o)) + ' · ' + fmt(o.total) + '</div>';
    if (o.status === 'preparando') {
      var mins = Math.round((now() - o.acceptedAt) / 60000);
      return '<div class="order-card"><div class="ob">' + head + '<div class="xs muted mt4">Aceptado ' + ago(o.acceptedAt) + ' · ' + mins + ' de ' + o.etaMin + ' min</div>' + note + '<button class="btn btn-green btn-sm btn-block mt12" data-a="ready" data-id="' + o.id + '">' + ic('check', 18) + ' Listo' + (o.mode === 'dom' ? ', ¿quién lo lleva?' : ' para recoger') + '</button></div></div>';
    }
    if (o.status === 'listo') {
      return '<div class="order-card"><div class="ob">' + head + (o.mode === 'dom'
        ? '<a class="btn btn-primary btn-sm btn-block mt12" href="#/rest/enviar/' + o.id + '">' + ic('bike', 18) + ' Elegir domiciliario</a>'
        : '<button class="btn btn-green btn-sm btn-block mt12" data-a="pinAsk" data-id="' + o.id + '">Entregar (pedir código)</button>') + '</div></div>';
    }
    if (o.status === 'en_camino') {
      var rd = o.riderId === 'yo' ? null : rider(o.riderId);
      return '<div class="order-card"><div class="ob">' + head + '<div class="small mt8">' + ic('bike', 14) + ' ' + (rd ? esc(rd.name) + ' · salió ' + ago(o.sentAt) : 'Lo lleva alguien del restaurante') + '</div>' + cust +
        '<div class="row mt12" style="gap:8px">' + (rd ? '<a class="btn btn-outline btn-sm" style="flex:1" href="#/wa/' + o.id + '">Ver chat</a>' : '') + '<button class="btn btn-green btn-sm" style="flex:1" data-a="pinAsk" data-id="' + o.id + '">Confirmar entrega</button></div></div></div>';
    }
    return '<div class="order-card" style="opacity:' + (o.status === 'entregado' ? 1 : .6) + '"><div class="ob">' + head + (o.rating ? '<div class="small mt4"><span style="color:var(--orange)">' + '★★★★★'.slice(0, o.rating) + '</span> ' + esc((o.tags || []).join(', ')) + '</div>' : '') + '</div></div>';
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
        '<span class="badge ' + (busy ? 'route' : 'green') + '">' + (busy ? 'En ruta' : 'Libre') + '</span><span class="ring"></span></button>';
    }).join('');
    rowsH += '<button class="radio-row' + (sel === 'yo' ? ' on' : '') + '" data-a="choose" data-id="' + id + '" data-v="yo"><span class="avatar sm" style="background:var(--track);color:var(--text)">' + ic('store', 18) + '</span><span class="grow"><span class="b" style="display:block">Lo llevo yo</span><span class="small muted">Alguien del restaurante</span></span><span class="ring"></span></button>';
    var rd = sel === 'yo' ? null : S.riders[sel];
    return '<div class="screen has-cta">' + topbar('¿Quién lo lleva?', '/rest', 'Pedido #' + o.id + ' listo') +
      '<div class="card row">' + photo(r.img, 'thumb s44') + '<div class="grow"><div class="b">' + esc(o.customer.name) + ' · ' + fmt(o.total) + ' ' + (o.pay === 'ef' ? 'efectivo' : o.pay) + '</div><div class="small muted ellipsis">' + esc(o.customer.address) + '</div></div></div>' +
      '<div class="row between mt20"><div class="t-h2">Mis domiciliarios</div><a class="link" href="#/rest/bolsa">Buscar más</a></div><div class="mt8">' + rowsH + '</div>' +
      '<button class="dashed-btn mt12" data-a="addRiderForm">' + ic('plus', 18) + ' Guardar un domiciliario</button>' +
      '<div class="note grey mt16 center">Le enviamos el pedido por WhatsApp. El pago lo acuerdan ustedes.</div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="sendRider" data-id="' + id + '">' + (rd ? 'Enviar a ' + esc(rd.name) : 'Lo llevo yo') + '</button></div>';
  }
  function riderMsg(o) {
    var r = R(o.restId);
    var cash = o.pay === 'ef' ? 'Cobrar ' + fmt(o.total) + ' en efectivo' + (o.cashGiven > o.total ? '. Paga con ' + fmt(o.cashGiven) + ', lleva ' + fmt(o.cashGiven - o.total) + ' de vueltas' : '') : 'Ya pagó por ' + (o.pay === 'nequi' ? 'Nequi' : 'Daviplata') + ' (no cobrar)';
    return '*Domicilio #' + o.id + '* · ' + r.name + '\n' +
      'Recoger: ' + r.address + '\n' +
      'Entregar: ' + o.customer.address + '\n' +
      'Cliente: ' + o.customer.name + ' · ' + phoneFmt(o.customer.phone) + '\n' +
      cash + '\n' +
      'Al entregar, pide el código de 4 números y responde: ENTREGADO + código';
  }
  function scrMisRiders() {
    var r = R(S.restId);
    var ids = (S.myRiders[r.id] || []).filter(function (x) { return S.riders[x]; });
    return '<div class="screen has-tabs">' + restHeader(r) + '<div class="row between mt20"><h1 class="t-title" style="font-size:22px">Mis domiciliarios</h1><a class="link" href="#/rest/bolsa">Buscar más</a></div>' +
      '<div class="small muted mt4">Tu propia lista. Tú eliges a quién mandar cada pedido; el pago lo acuerdan ustedes.</div>' +
      '<div class="card mt12" style="padding:4px 14px">' + (ids.length ? ids.map(function (rid) {
        var rd = S.riders[rid], c = avColor(rid), busy = riderBusy(rid);
        return '<div class="list-row"><span class="avatar sm" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(rd.name) + '</span><div class="grow"><div class="b ellipsis">' + esc(rd.name) + '</div><div class="small muted ellipsis">' + esc(rd.vehicle || 'Moto') + ' · ' + phoneFmt(rd.phone) + '</div></div>' +
          '<span class="badge ' + (busy ? 'route' : 'green') + '">' + (busy ? 'En ruta' : 'Libre') + '</span>' +
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
    var r = R(S.restId);
    return '<div class="screen has-tabs">' + topbar('Bolsa de domiciliarios', fromRest ? '/rest/domiciliarios' : null) +
      '<div class="muted small" style="margin-top:-8px">Gente de Villanueva buscando trabajo. Escríbeles y acuerden pago y horario.</div>' +
      '<div class="chips mt12">' + [['noche', 'Noche'], ['finde', 'Fines de semana'], ['moto', 'Con moto']].map(function (f) { return '<button class="chip' + (F[f[0]] ? ' on' : '') + '" data-a="bf" data-v="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div><div class="mt12">' +
      (list.length ? list.map(function (rd) {
        var c = avColor(rd.id), saved = my.indexOf(rd.id) >= 0;
        return '<div class="card" style="margin-bottom:12px"><div class="row"><div class="avatar" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(rd.name) + '</div><div class="grow"><div class="t-h3">' + esc(rd.name) + (rd.id === S.myProfile ? ' <span class="badge orange">Tú</span>' : '') + '</div><div class="small muted">' + esc(rd.vehicle) + ' · ' + esc(rd.barrio) + '</div></div></div>' +
          '<div class="chips mt12" style="gap:6px">' + (rd.hours || []).map(function (hh) { return '<span class="badge grey">' + hh + '</span>'; }).join('') + (rd.docs || []).map(function (d) { return '<span class="badge green">' + ic('check', 12, { sw: 3 }) + ' ' + d + ' subida</span>'; }).join('') + '</div>' +
          '<div class="row mt12" style="gap:8px"><a class="btn btn-green btn-sm grow" target="_blank" rel="noopener" href="' + waLink(rd.phone, 'Hola ' + first(rd.name) + ', te vi en la bolsa de domiciliarios de Pido y Ido. Te escribo de ' + r.name + ', ¿tienes tiempo para hacer domicilios?') + '">' + ic('msg', 18) + ' Escribir por WhatsApp</a>' +
          '<button class="btn btn-sm ' + (saved ? 'btn-soft' : 'btn-outline') + '" data-a="saveRider" data-v="' + rd.id + '" aria-label="Guardar">' + ic(saved ? 'check' : 'bookmark', 18) + (saved ? ' Guardado' : ' Guardar') + '</button></div></div>';
      }).join('') : '<div class="empty">Nadie con esos filtros todavía.</div>') +
      '</div><div class="note amber">Pido y Ido no revisa documentos ni recomienda a nadie. Revisa tú la licencia y el SOAT antes de trabajar con alguien.</div></div>' + tabs('rest', 'bolsa');
  }

  // ---------- Rider ----------
  function scrDom() {
    var prof = S.myProfile && S.riders[S.myProfile];
    var assigned = S.orders.filter(function (o) { return o.riderId && o.riderId !== 'yo' && (o.status === 'en_camino' || o.status === 'entregado') && S.chats[o.id]; });
    assigned.sort(function (a, b) { return (b.sentAt || 0) - (a.sentAt || 0); });
    var h = '<div class="screen has-tabs">' + topbar('Mensajes', null, 'Domiciliario') +
      '<div class="small muted" style="margin-top:-8px">Los pedidos te llegan por WhatsApp desde el restaurante. Aquí ves cómo se ven y puedes probar la respuesta <b>ENTREGADO + código</b>.</div>';
    if (assigned.length) {
      h += '<div class="card mt16" style="padding:4px 14px">' + assigned.map(function (o) {
        var r = R(o.restId), rd = rider(o.riderId);
        return '<a class="list-row" href="#/wa/' + o.id + '">' + logo(44) + '<div class="grow"><div class="row between"><span class="b">' + r.name + '</span>' + statusBadge(o) + '</div><div class="small muted ellipsis">Para ' + esc(rd ? rd.name : '') + ' · Domicilio #' + o.id + '</div></div></a>';
      }).join('') + '</div>';
    } else {
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
    var r = R(o.restId), rd = rider(o.riderId);
    var chat = S.chats[id] || [];
    var d = r.dishes.filter(function (x) { return o.items[0] && x.id === o.items[0].id; })[0];
    var cash = o.pay === 'ef' ? '<b>Cobrar ' + fmt(o.total) + ' en efectivo</b>' + (o.cashGiven > o.total ? '<br>Paga con ' + fmt(o.cashGiven) + ' · lleva ' + fmt(o.cashGiven - o.total) + ' de vueltas' : '') : '<b>Ya pagó por ' + (o.pay === 'nequi' ? 'Nequi' : 'Daviplata') + '.</b> No cobrar.';
    var mapQ = o.geo ? o.geo.lat + ',' + o.geo.lng : o.customer.address + ', Villanueva, Casanare';
    var h = '<div class="wa"><div class="wa-head"><a href="#/dom" aria-label="Volver" style="padding:6px">' + ic('back', 22) + '</a>' + logo(40) + '<div class="grow"><div class="b">' + r.name + '</div><div class="xs muted">vía Pido y Ido · WhatsApp de ' + esc(rd ? rd.name : 'domiciliario') + '</div></div></div><div class="wa-body">' +
      '<div class="day-pill">Hoy ' + hora(o.sentAt || now()) + '</div>' +
      '<div class="bubble order">' + photo(d ? d.img : r.img, '', 'height:120px;width:100%') + '<div style="padding:10px 12px"><div class="b" style="color:var(--cta);font-size:15px">Domicilio #' + o.id + '</div>' +
      '<div class="mt8"><b>Recoger:</b> ' + r.name + ', ' + r.address + '</div><div class="mt4"><b>Entregar:</b> ' + esc(o.customer.address) + '</div><div class="mt4"><b>Cliente:</b> ' + esc(o.customer.name) + ' · ' + phoneFmt(o.customer.phone) + '</div>' +
      '<div class="note soft mt8">' + cash + '</div><div class="small muted mt8">Al entregar, pide el código de 4 números y responde: <b>ENTREGADO + código</b></div><div class="time">' + hora(o.sentAt || now()) + '</div></div>' +
      '<button class="wa-qr" data-a="waQuick" data-id="' + id + '" data-v="Voy en camino">Voy en camino</button><a class="wa-qr" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQ) + '">Ver en el mapa</a></div>';
    h += chat.map(function (m) {
      return '<div class="bubble' + (m.out ? ' out' : '') + '">' + (m.ok ? '<span class="green">' + ic('check', 16, { sw: 3 }) + '</span> ' : '') + esc(m.text) + '<div class="time">' + hora(m.t) + (m.out ? ' ✓✓' : '') + '</div></div>';
    }).join('');
    h += '</div>' + (o.status === 'en_camino' ? '<div class="wa-input"><input id="wamsg" placeholder="Escribe: ENTREGADO ' + '1234" autocomplete="off" data-enter="waSend" data-id="' + id + '"><button data-a="waSend" data-id="' + id + '" aria-label="Enviar">' + ic('send', 20) + '</button></div>'
      : '<div class="wa-input" style="justify-content:center"><a class="btn btn-outline btn-sm" href="#/pedido/' + id + '">Ver el pedido como cliente</a></div>') + '</div>';
    return h;
  }

  // ---------- Promoter ----------
  function promoLink(restId) {
    var base = location.href.split('#')[0];
    return base + '#/r/' + restId + '?p=' + S.promo.slug;
  }
  function scrPromo() {
    var pr = R(S.promo.restId);
    var link = promoLink(pr.id);
    var pretty = link.replace(/^https?:\/\//, '');
    return '<div class="screen has-tabs has-cta"><span class="badge orange">Recomienda y gana</span><h1 class="t-title mt12">Comparte tu restaurante favorito</h1>' +
      '<div class="muted mt8">Ganas <b style="color:var(--text)">' + S.promo.pct + '%</b> <button class="badge amber" data-a="pctEdit" style="vertical-align:1px">ejemplo · cambiar</button> de cada pedido entregado que llegue con tu enlace.</div>' +
      '<div class="row mt16" style="gap:10px">' + RESTAURANTS.map(function (x) {
        var on = x.id === pr.id;
        return '<button class="card flat row grow" style="padding:10px;gap:8px;' + (on ? 'border:2px solid var(--orange)' : '') + '" data-a="promoRest" data-v="' + x.id + '">' + photo(x.img, 'thumb', 'width:36px;height:36px;border-radius:999px') + '<span class="small b ellipsis" style="text-align:left">' + x.short + '</span></button>';
      }).join('') + '</div>' +
      '<div class="qr-card mt16"><div class="qr-wrap"><canvas id="qr" width="210" height="210"></canvas><div class="qr-logo">' + logo(40) + '</div></div><div class="t-h3 mt12">' + pr.name + '</div>' +
      '<div class="linkbox"><span>' + esc(pretty) + '</span><button class="btn btn-soft btn-sm" style="height:38px" data-a="copyLink">' + ic('copy', 16) + ' Copiar</button></div>' +
      '<button class="btn btn-ghost btn-block mt8" data-a="downloadQR" style="color:var(--green)">' + ic('download', 18) + ' Descargar QR para imprimir</button>' +
      '<a class="small muted" href="' + esc('#/r/' + pr.id + '?p=' + S.promo.slug) + '" style="text-decoration:underline">Probar el enlace aquí</a></div>' +
      '<div class="steps mt20"><div><div class="n">1</div><div class="small muted">Compartes tu enlace o QR</div></div><div><div class="n">2</div><div class="small muted">Tus conocidos piden</div></div><div><div class="n">3</div><div class="small muted">Te pagamos a Nequi</div></div></div></div>' +
      '<div class="cta-wrap above-tabs"><a class="btn btn-primary btn-xl btn-block" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('¿Ya probaste ' + pr.name + '? Pide aquí y te lo llevan a la casa: ' + link) + '">' + ic('share', 20) + ' Compartir por WhatsApp</a></div>' + tabs('promo', 'enlace');
  }
  function promoReal() {
    return S.orders.filter(function (o) { return o.ref && o.ref.slug === S.promo.slug; });
  }
  function scrGanancias() {
    var real = promoReal();
    var del = real.filter(function (o) { return o.status === 'entregado'; });
    var realSum = del.reduce(function (a, o) { return a + Math.round(o.subtotal * S.promo.pct / 100); }, 0);
    var month = new Date().toLocaleDateString('es-CO', { month: 'long' });
    var weeks = [9800, 14200, 12200, 12400 + realSum];
    var max = Math.max.apply(null, weeks);
    var total = 48600 + realSum;
    var ex = [
      { t: '#0139 · La Plaza', s: 'Pedido 2 de 3', a: 1200, img: IMG.pizza2 },
      { t: '#0137 · El Llanero', s: 'Cliente nuevo · pedido 1 de 3', a: 980, img: IMG.pollo },
      { t: '#0136 · El Llanero', s: 'Cancelado · no suma', a: 0, img: IMG.emp, x: true }
    ];
    var rows = real.slice().reverse().map(function (o) {
      var ok = o.status === 'entregado', bad = ['rechazado', 'cancelado'].indexOf(o.status) >= 0;
      return { t: '#' + o.id + ' · ' + R(o.restId).short, s: ok ? 'Por tu enlace · entregado' : bad ? 'Cancelado · no suma' : 'En curso · suma al entregarse', a: ok ? Math.round(o.subtotal * S.promo.pct / 100) : 0, img: R(o.restId).img, x: bad, pend: !ok && !bad };
    }).concat(ex);
    return '<div class="screen has-tabs"><div class="row between"><h1 class="t-title">Mis ganancias</h1><span class="badge amber">Montos de ejemplo</span></div>' +
      '<div class="earn mt16"><div class="small" style="opacity:.85">Este mes · ' + month + '</div><div class="big">' + fmt(total) + '</div>' +
      '<div class="bars">' + weeks.map(function (w, i) { return '<div class="' + (i === 3 ? 'cur' : '') + '" style="height:' + Math.round(w / max * 100) + '%"></div>'; }).join('') + '</div>' +
      '<div class="bars-l"><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Esta semana</span></div></div>' +
      '<div class="stats mt12" style="grid-template-columns:1fr 1fr"><div class="stat"><div class="xs muted">Clientes traídos</div><div class="v">' + (14 + new Set(real.map(function (o) { return o.customer.phone; })).size) + '</div></div><div class="stat"><div class="xs muted">Pedidos entregados</div><div class="v">' + (31 + del.length) + '</div></div></div>' +
      '<div class="card mt12" style="padding:4px 14px">' + rows.map(function (x) {
        return '<div class="list-row" style="opacity:' + (x.x ? .5 : 1) + '">' + photo(x.img, 'thumb s44') + '<div class="grow"><div class="b">' + x.t + '</div><div class="small muted">' + x.s + '</div></div><div class="b" style="color:' + (x.a ? 'var(--green)' : 'var(--muted)') + '">' + (x.a ? '+' + fmt(x.a) : x.pend ? '…' : '$0') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="small muted mt12">Solo cuentan pedidos entregados de clientes que llegaron con tu enlace. Los cancelados no suman.</div>' +
      '<div class="card mt12 row" style="background:var(--soft)"><div class="grow"><div class="b" style="color:var(--soft-t)">Próximo pago a Nequi</div><div class="small" style="color:var(--soft-t)">1 de ' + (function () { var d = new Date(); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('es-CO', { month: 'long' }); })() + ' · 310 000 0000</div></div><div class="num" style="font-size:22px">' + fmt(12400 + realSum) + '</div></div></div>' + tabs('promo', 'ganancias');
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
      case 'confirmar': return scrConfirmar();
      case 'pedido': return scrPedido(p[1]);
      case 'calificar': return scrCalificar(p[1]);
      case 'rest':
        if (p[1] === 'enviar') return scrEnviar(p[2]);
        if (p[1] === 'domiciliarios') return scrMisRiders();
        if (p[1] === 'bolsa') return scrBolsa(true);
        return scrRest(rt.query);
      case 'dom': return p[1] === 'perfil' ? scrDomPerfil() : scrDom();
      case 'wa': return scrWa(p[1]);
      case 'promo': return p[1] === 'ganancias' ? scrGanancias() : scrPromo();
      default: return scrStart();
    }
  }
  function render() {
    var rt = parse();
    var key = location.hash;
    var same = key === ui.lastRoute;
    var y = window.scrollY;
    var active = document.activeElement && document.activeElement.id;
    document.getElementById('app').innerHTML = view(rt);
    if (same) window.scrollTo(0, y); else { window.scrollTo(0, 0); sheet(null); }
    ui.lastRoute = key;
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
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(logo(48).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
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
    dec: function (el) { var d = el.dataset.d; S.cart.items[d] = Math.max(0, (S.cart.items[d] || 0) - 1); if (!S.cart.items[d]) delete S.cart.items[d]; if (!cartCount()) S.cart.restId = null; save(); render(); },
    newCart: function (el) { S.cart = { restId: el.dataset.r, items: {}, mode: 'dom' }; sheet(null); addToCart(el.dataset.r, el.dataset.d); },
    mode: function (el) { if (S.cart.restId !== el.dataset.r) { if (cartCount()) { toast('Primero termina o vacía tu carrito actual'); return; } S.cart = { restId: el.dataset.r, items: {}, mode: el.dataset.v }; } else S.cart.mode = el.dataset.v; save(); render(); },
    fav: function () { toast('Guardado en tus favoritos'); },
    pay: function (el) { S.co.pay = el.dataset.v; save(); render(); },
    cash: function (el) { S.co.cash = el.dataset.v; save(); render(); },
    clearCart: function () { S.cart = { restId: null, items: {}, mode: 'dom' }; save(); go('/inicio'); },
    geo: function () {
      if (!navigator.geolocation) { toast('Tu celular no permite ubicación'); return; }
      toast('Buscando tu ubicación…');
      navigator.geolocation.getCurrentPosition(function (p) { S.co.geo = { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }; save(); render(); toast('Ubicación guardada'); },
        function () { toast('No pudimos ver tu ubicación. Igual llega con la dirección escrita.'); }, { enableHighAccuracy: true, timeout: 10000 });
    },
    placeOrder: function () {
      var lines = cartLines(); if (!lines.length) return;
      var r = R(S.cart.restId);
      var addr = (S.user.address || '').trim(), phone = String(S.user.phone || '').replace(/\D/g, '');
      if (S.cart.mode === 'dom' && addr.length < 6) { toast('Escribe tu dirección para que te encuentren'); var a = document.getElementById('addr'); if (a) { a.classList.add('err'); a.focus(); } return; }
      if (!(S.user.name || '').trim()) { toast('Escribe tu nombre'); return; }
      if (phone.length < 10) { toast('Escribe tu celular (10 números)'); var pe = document.getElementById('ph'); if (pe) { pe.classList.add('err'); pe.focus(); } return; }
      var sub = cartSubtotal(), fee = cartFee(), total = sub + fee;
      var o = {
        id: String(S.nextId++).padStart(4, '0'), restId: r.id, mine: true,
        customer: { name: S.user.name.trim(), phone: phone, address: S.cart.mode === 'dom' ? addr : 'Recoge en el local' },
        items: lines.map(function (l) { return { id: l.id, name: l.name, price: l.price, qty: l.qty }; }),
        subtotal: sub, fee: fee, total: total, mode: S.cart.mode, note: S.co.note, pay: S.co.pay,
        cashGiven: S.co.pay === 'ef' ? (S.co.cash === 'exact' ? total : +S.co.cash) : 0,
        pin: randPin(), status: 'recibido', createdAt: now(), geo: S.co.geo,
        ref: S.ref && S.ref.restId === r.id ? { slug: S.ref.slug } : null
      };
      S.orders.unshift(o);
      S.cart = { restId: null, items: {}, mode: 'dom' }; S.co.note = ''; S.co.cash = 'exact'; S.co.geo = null;
      save(); go('/pedido/' + o.id); toast('¡Pedido enviado a ' + r.short + '!');
    },
    cancelOrder: function (el) { var o = order(el.dataset.id); if (o && o.status === 'recibido') { o.status = 'cancelado'; save(); go('/pedidos'); toast('Pedido cancelado'); } },
    reorder: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      S.cart = { restId: o.restId, items: {}, mode: o.mode || 'dom' };
      o.items.forEach(function (i) { S.cart.items[i.id] = i.qty; });
      save(); go('/confirmar');
    },
    star: function (el) { ui.rate.stars = +el.dataset.v; render(); },
    tag: function (el) { ui.rate.tags[el.dataset.v] = !ui.rate.tags[el.dataset.v]; render(); },
    sendRating: function (el) {
      var o = order(el.dataset.id); if (!o || !ui.rate.stars) return;
      o.rating = ui.rate.stars; o.tags = Object.keys(ui.rate.tags).filter(function (k) { return ui.rate.tags[k]; });
      var r = R(o.restId), cur = restRating(r);
      S.ratings[r.id] = { rating: (cur.rating * cur.count + o.rating) / (cur.count + 1), count: cur.count + 1 };
      ui.rate = null; save(); go('/inicio'); toast('¡Gracias por calificar!');
    },
    editAddress: function () {
      sheet('<div class="t-h2">¿Dónde te lo llevamos?</div><textarea class="input mt12" id="addrS" rows="3">' + esc(S.user.address) + '</textarea><button class="btn btn-primary btn-block mt12" data-a="saveAddrSheet">Guardar dirección</button>');
    },
    saveAddrSheet: function () { var v = document.getElementById('addrS').value.trim(); if (v) { S.user.address = v; save(); } sheet(null); render(); },
    saveProfile: function () { save(); render(); toast('Datos guardados'); },
    resetAsk: function () {
      sheet('<div class="t-h2">¿Reiniciar la demo?</div><div class="muted mt8">Se borran los pedidos, domiciliarios y cambios que hiciste en este celular, y vuelven los datos de ejemplo.</div><button class="btn btn-primary btn-block mt16" data-a="reset">Sí, reiniciar</button><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Cancelar</button>');
    },
    reset: function () { S = seed(); ui.rate = null; ui.signup = null; ui.choose = {}; save(); sheet(null); go('/'); toast('Demo reiniciada'); },
    install: function () { if (ui.installEvt) { ui.installEvt.prompt(); ui.installEvt.userChoice.then(function () { ui.installEvt = null; render(); }); } },
    // restaurant
    pickRest: function () {
      sheet('<div class="t-h2">¿Qué restaurante eres?</div><div class="small muted mt4">En la demo puedes ver el panel de cualquiera.</div><div class="mt12">' + RESTAURANTS.map(function (r) {
        return '<button class="radio-row' + (S.restId === r.id ? ' on' : '') + '" data-a="setRest" data-v="' + r.id + '">' + photo(r.img, 'thumb s44') + '<span class="grow b">' + r.name + '</span><span class="ring"></span></button>';
      }).join('') + '</div>');
    },
    setRest: function (el) { S.restId = el.dataset.v; save(); sheet(null); render(); },
    toggleOpen: function () { S.open[S.restId] = !S.open[S.restId]; save(); render(); toast(S.open[S.restId] ? 'Abierto: ya recibes pedidos' : 'Cerrado: no recibes pedidos'); },
    rtab: function (el) { ui.rtab = el.dataset.v; render(); },
    etaPick: function (el) { ui.choose['eta' + el.dataset.id] = +el.dataset.v; render(); },
    accept: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      o.status = 'preparando'; o.etaMin = ui.choose['eta' + o.id] || 30; o.acceptedAt = now(); save();
      ui.rtab = 'preparando'; render(); toast('Aceptado. ' + first(o.customer.name) + ' ya lo ve en su pedido');
    },
    reject: function (el) {
      var id = el.dataset.id;
      sheet('<div class="t-h2">¿Por qué no puedes aceptarlo?</div><div class="mt12">' + ['Estamos muy llenos ahora', 'Se acabó un producto', 'No llegamos a esa dirección', 'Ya vamos a cerrar'].map(function (x) {
        return '<button class="radio-row" data-a="rejectDo" data-id="' + id + '" data-v="' + x + '"><span class="ring"></span><span class="grow">' + x + '</span></button>';
      }).join('') + '</div><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Volver</button>');
    },
    rejectDo: function (el) { var o = order(el.dataset.id); if (!o) return; o.status = 'rechazado'; o.rejectReason = el.dataset.v + '.'; save(); sheet(null); render(); toast('Pedido rechazado. Le avisamos al cliente.'); },
    ready: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      o.status = 'listo'; save();
      if (o.mode === 'dom') go('/rest/enviar/' + o.id); else { render(); toast('Le avisamos que ya puede recogerlo'); }
    },
    choose: function (el) { ui.choose['r' + el.dataset.id] = el.dataset.v; render(); },
    sendRider: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      var sel = ui.choose['r' + o.id] || 'yo';
      o.riderId = sel; o.status = 'en_camino'; o.sentAt = now();
      if (sel === 'yo') { save(); ui.rtab = 'camino'; go('/rest'); toast('En camino. Al entregar, pide el código al cliente.'); return; }
      var rd = S.riders[sel];
      S.chats[o.id] = S.chats[o.id] || [];
      save(); ui.rtab = 'camino';
      var msg = riderMsg(o);
      sheet('<div class="t-h2">Pedido listo para ' + esc(rd.name) + '</div><div class="small muted mt4">Así le llega por WhatsApp:</div>' +
        '<div class="note grey mt12" style="white-space:pre-line;color:var(--text);font-size:13px">' + esc(msg) + '</div>' +
        '<a class="btn btn-green btn-block mt16" target="_blank" rel="noopener" href="' + waLink(rd.phone, msg) + '">' + ic('msg', 18) + ' Enviar por WhatsApp</a>' +
        '<a class="btn btn-outline btn-block mt8" href="#/wa/' + o.id + '">Ver como domiciliario (demo)</a>' +
        '<a class="btn btn-ghost btn-block mt8" href="#/rest">Volver al panel</a>' +
        '<div class="xs muted center mt8">Cuando la app esté en marcha, este mensaje se envía solo desde el número de Pido y Ido.</div>');
    },
    pinAsk: function (el) {
      var id = el.dataset.id;
      sheet('<div class="t-h2">Confirmar entrega</div><div class="muted mt8">Pídele al cliente el código de 4 números.</div><input class="input mt12 center num" id="pinIn" inputmode="numeric" maxlength="4" placeholder="• • • •" style="font-size:28px;letter-spacing:12px">' +
        '<div id="pinErr" class="err-msg center"></div><button class="btn btn-primary btn-block mt12" data-a="pinCheck" data-id="' + id + '">Confirmar</button>');
    },
    pinCheck: function (el) {
      var o = order(el.dataset.id), v = (document.getElementById('pinIn').value || '').trim();
      if (!o) return;
      if (v !== o.pin) { document.getElementById('pinErr').textContent = 'Código incorrecto. Revisa con el cliente.'; return; }
      deliver(o); sheet(null); ui.rtab = 'hechos'; render(); toast('Pedido #' + o.id + ' entregado');
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
      var id = 'r' + now().toString(36);
      S.riders[id] = { id: id, name: n, phone: p, vehicle: ui.rv || 'Moto', barrio: '' };
      (S.myRiders[S.restId] = S.myRiders[S.restId] || []).push(id);
      var rt = parse(); if (rt.parts[1] === 'enviar') ui.choose['r' + rt.parts[2]] = id;
      save(); sheet(null); render(); toast(n + ' guardado en tu lista');
    },
    removeRider: function (el) { var l = S.myRiders[S.restId] || []; S.myRiders[S.restId] = l.filter(function (x) { return x !== el.dataset.v; }); save(); render(); toast('Quitado de tu lista'); },
    saveRider: function (el) {
      var l = S.myRiders[S.restId] = S.myRiders[S.restId] || [], id = el.dataset.v, i = l.indexOf(id);
      if (i >= 0) { l.splice(i, 1); toast('Quitado de tu lista'); } else { l.push(id); toast('Guardado en Mis domiciliarios'); }
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
      var id = S.myProfile || ('me' + now().toString(36));
      S.riders[id] = { id: id, name: f.name.trim(), phone: ph, barrio: f.barrio.trim(), vehicle: f.vehicle, hours: f.hours.slice(), docs: [].concat(f.lic ? ['Licencia'] : [], f.soat ? ['SOAT'] : []), board: true };
      S.myProfile = id; ui.signup = null; ui.editProfile = false; ui.signupErr = null;
      save(); render(); toast('¡Tu perfil ya está en la bolsa!');
    },
    editRiderProfile: function () { ui.editProfile = true; ui.signup = null; render(); },
    unpublish: function () { var id = S.myProfile; if (id) { delete S.riders[id]; Object.keys(S.myRiders).forEach(function (k) { S.myRiders[k] = S.myRiders[k].filter(function (x) { return x !== id; }); }); } S.myProfile = null; ui.signup = null; save(); render(); toast('Perfil quitado de la bolsa'); },
    waQuick: function (el) { waReply(el.dataset.id, el.dataset.v); },
    waSend: function (el) { var i = document.getElementById('wamsg'); var v = (i && i.value || '').trim(); if (!v) return; waReply(el.dataset.id, v); },
    // promoter
    promoRest: function (el) { S.promo.restId = el.dataset.v; save(); render(); },
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
    pct: function (el) { S.promo.pct = +el.dataset.v; save(); sheet(null); render(); }
  };
  function deliver(o) {
    o.status = 'entregado'; o.deliveredAt = now();
  }
  function waReply(id, text) {
    var o = order(id); if (!o) return;
    var chat = S.chats[id] = S.chats[id] || [];
    chat.push({ out: true, text: text, t: now() });
    var m = text.match(/^\s*entregado\s*#?\s*(\d{4})\s*$/i);
    if (/^voy en camino$/i.test(text.trim())) {
      o.onWay = true; chat.push({ text: 'Listo, le avisamos a ' + first(o.customer.name) + ' que vas en camino.', t: now() });
    } else if (m) {
      if (o.status !== 'en_camino') chat.push({ text: 'Este pedido ya estaba cerrado.', t: now() });
      else if (m[1] === o.pin) { deliver(o); chat.push({ ok: true, text: 'Código correcto. Pedido #' + o.id + ' entregado. ¡Gracias, ' + callName(rider(o.riderId) ? rider(o.riderId).name : '') + '!', t: now() }); }
      else chat.push({ text: 'Código incorrecto. Pídele al cliente el código de 4 números y escribe: ENTREGADO + código.', t: now() });
    } else if (/^entregado/i.test(text)) {
      chat.push({ text: 'Falta el código. Escribe por ejemplo: ENTREGADO 1234', t: now() });
    } else {
      chat.push({ text: 'Recibido. Para cerrar el pedido escribe: ENTREGADO + el código del cliente.', t: now() });
    }
    save(); render();
  }

  // ---------- Events ----------
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-a]');
    if (!el) return;
    if (el.dataset.a === 'closeSheet' && ev.target.closest('[data-stop]') && el.classList.contains('sheet-bg')) return;
    var fn = A[el.dataset.a];
    if (fn) { ev.preventDefault(); fn(el, ev); }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.m) { setPath(t.dataset.m, t.value); t.classList.remove('err'); }
    if (t.dataset.live === 'q') { ui.q = t.value; var res = document.getElementById('results'); if (res) res.innerHTML = searchResults(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.dataset.file && t.files && t.files[0]) { ui.signup[t.dataset.file] = true; render(); toast('Foto agregada'); }
  });
  document.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (ev.key === 'Enter' && t.dataset && t.dataset.enter) { ev.preventDefault(); A[t.dataset.enter](t); }
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('storage', function (e) { if (e.key === KEY) { S = load(); render(); } });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ui.installEvt = e; if (parse().parts.length === 0) render(); });
  setInterval(function () {
    var p = parse().parts[0];
    if ((p === 'pedido' || p === 'rest') && !document.querySelector('.sheet-bg') && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) render();
  }, 20000);

  render();
})();
