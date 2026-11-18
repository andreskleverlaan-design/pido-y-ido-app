/* Pido y Ido — prototipo funcional (datos de demo guardados en este celular) */
(function () {
  'use strict';
  var CLOUD = window.PYI_CLOUD || null;
  var ONLINE = !!CLOUD;

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
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 11 5 12 8c1-3 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
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
  var NO_REST = { id: '', name: 'Restaurante', short: 'Restaurante', img: '', rating: 0, count: 0, eta: '30–40 min', pickup: '15 min', min: 0, fee: 0, cats: [], sub: '', address: '', phone: '', nequi: '', dishes: [] };
  function R(id) { for (var i = 0; i < RESTAURANTS.length; i++) if (RESTAURANTS[i].id === id) return RESTAURANTS[i]; return ONLINE ? NO_REST : RESTAURANTS[0]; }
  // restaurants customers can order from (online: only those with a menu)
  function shown() { return RESTAURANTS.filter(function (r) { return !ONLINE || r.dishes.length; }); }

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
  if (ONLINE && S.restCache && S.restCache.length) Array.prototype.splice.apply(RESTAURANTS, [0, RESTAURANTS.length].concat(S.restCache));
  else if (ONLINE) RESTAURANTS.length = 0;
  var ui = { cat: null, q: '', rtab: 'nuevos', bf: {}, rate: null, signup: null, choose: {}, lastRoute: '', installEvt: null };

  function order(id) { for (var i = 0; i < S.orders.length; i++) if (S.orders[i].id === id) return S.orders[i]; return null; }
  function rider(id) { return S.riders[id] || null; }
  function riderOf(o) { return o && o.riderId && o.riderId !== 'yo' ? (S.riders[o.riderId] || (o.rider ? { id: o.riderId, name: o.rider.name, phone: o.rider.phone, vehicle: o.rider.vehicle } : null)) : null; }
  function restRating(r) { var x = S.ratings[r.id]; return x ? x : { rating: r.rating, count: r.count }; }
  function ratingTxt(r) { var x = restRating(r); return x.count ? x.rating.toFixed(1).replace('.', ',') + ' (' + x.count + ')' : 'Nuevo'; }
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
      rest: [['pedidos', 'receipt', 'Pedidos', '/rest']].concat(ONLINE ? [['menu', 'store', 'Menú', '/rest/menu']] : [], [['riders', 'bike', 'Domiciliarios', '/rest/domiciliarios'], ['bolsa', 'users', 'Bolsa', '/rest/bolsa'], ['salir', 'swap', 'Cambiar rol', '/']]),
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
    { id: 'rest', icon: 'store', title: 'Tengo un restaurante', sub: 'Recibe pedidos y despacha', cta: 'Registrar mi restaurante', home: '/rest', first: '/rest/registro' },
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
      (ONLINE ? '<a class="welcome-login" href="#/rest/login">¿Tienes restaurante? <b>Iniciar sesión</b></a>'
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

  function scrRestRegistroLive() {
    var f = ui.reg || (ui.reg = { name: '', phone: '', addr: '', pass: '' });
    var logged = !!CLOUD.restUid(), err = ui.regErr || {};
    return '<div class="screen has-cta" style="padding-bottom:calc(170px + var(--safe-b))">' + topbar(logged ? 'Completa tu restaurante' : 'Registra tu restaurante', '/', 'Gratis para empezar') +
      '<div class="muted small" style="margin-top:-6px">En 10 minutos recibes pedidos. Después agregas tu menú (o te ayudamos a pasarlo).</div>' +
      '<div class="card mt16"><div class="field"><label class="label" for="rg1">Nombre del restaurante</label><input class="input' + (err.name ? ' err' : '') + '" id="rg1" data-m="ui.reg.name" value="' + esc(f.name) + '" placeholder="Asadero El Llanero"></div>' +
      (logged ? '' : '<div class="field"><label class="label" for="rg2">WhatsApp del negocio</label><input class="input' + (err.phone ? ' err' : '') + '" id="rg2" data-m="ui.reg.phone" inputmode="tel" value="' + esc(f.phone) + '" placeholder="310 000 0000"><div class="xs muted mt4">Con este número entras a tu panel.</div></div>') +
      '<div class="field"><label class="label" for="rg3">Dirección</label><input class="input' + (err.addr ? ' err' : '') + '" id="rg3" data-m="ui.reg.addr" value="' + esc(f.addr) + '" placeholder="Calle 10 # 8-24, El Centro"></div>' +
      (logged ? '' : '<div class="field"><label class="label" for="rg4">Crea una clave</label><input class="input' + (err.pass ? ' err' : '') + '" id="rg4" data-m="ui.reg.pass" type="password" autocomplete="new-password" value="' + esc(f.pass) + '" placeholder="Mínimo 6 letras o números"></div>') +
      (ui.regMsg ? '<div class="err-msg">' + esc(ui.regMsg) + '</div>' : '') + '</div>' +
      (logged ? '' : '<div class="small muted center mt16">¿Ya tienes cuenta? <a class="link" href="#/rest/login">Inicia sesión</a></div>') + '</div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="regDo"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Un momento…' : logged ? 'Crear mi restaurante' : 'Crear mi cuenta') + '</button></div>';
  }
  function scrRestLogin() {
    var f = ui.login || (ui.login = { phone: '', pass: '' });
    return '<div class="screen has-cta">' + topbar('Entra a tu restaurante', '/', 'Panel del restaurante') +
      '<div class="card"><div class="field"><label class="label" for="lg1">WhatsApp del negocio</label><input class="input" id="lg1" data-m="ui.login.phone" inputmode="tel" autocomplete="username" value="' + esc(f.phone) + '" placeholder="310 000 0000"></div>' +
      '<div class="field"><label class="label" for="lg2">Clave</label><input class="input" id="lg2" data-m="ui.login.pass" type="password" autocomplete="current-password" data-enter="restLoginDo" value="' + esc(f.pass) + '"></div>' +
      (ui.loginMsg ? '<div class="err-msg">' + esc(ui.loginMsg) + '</div>' : '') + '</div>' +
      '<div class="small muted center mt16">¿Aún no estás en Pido y Ido? <a class="link" href="#/rest/registro">Registra tu restaurante</a></div>' +
      '<div class="xs muted center mt8">¿Olvidaste tu clave? Escríbele a Pido y Ido y te ayudamos.</div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="restLoginDo"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Entrando…' : 'Entrar') + '</button></div>';
  }
  function scrLoading(title) {
    return '<div class="screen">' + topbar(title || 'Pido y Ido', '/') + '<div class="empty"><div class="ic">' + ic('refresh', 26) + '</div>Cargando…</div></div>';
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
    var list = shown().filter(function (r) { return !ui.cat || r.cats.indexOf(ui.cat) >= 0; });
    var openN = shown().filter(function (r) { return S.open[r.id]; }).length;
    list.sort(function (a, b) { return (S.open[b.id] ? 1 : 0) - (S.open[a.id] ? 1 : 0); });
    var h = '<div class="screen has-tabs' + (cartCount() ? ' has-cta' : '') + '">' +
      '<div class="row">' + logo(40, 'mark') + '<button class="grow" style="text-align:left" data-a="editAddress"><div class="xs muted">Entregar en</div><div class="b row" style="gap:4px;font-size:15px"><span class="ellipsis">' + (S.user.address ? esc(S.user.address.split(',')[0]) + ', Villanueva' : 'Agrega tu dirección') + '</span>' + ic('down', 16) + '</div></button>' +
      '<a class="icon-btn" href="#/confirmar" aria-label="Carrito" style="position:relative">' + ic('bag', 20) + (cartCount() ? '<span style="position:absolute;top:-2px;right:-2px;background:var(--cta);color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">' + cartCount() + '</span>' : '') + '</a></div>' +
      '<h1 class="t-title mt16" style="font-size:28px">¿Qué se te antoja hoy' + (S.user.name ? ', ' + esc(first(S.user.name)) : '') + '?</h1>' +
      '<a class="search mt16" href="#/buscar">' + ic('search', 20) + '<span class="muted">Busca empanadas, pizza, arepas…</span></a>';
    if (active) {
      h += '<a class="card mt16 row" href="#/pedido/' + active.id + '" style="border:2px solid var(--green)"><span class="pulse"></span><div class="grow"><div class="b">Pedido #' + active.id + ' · ' + R(active.restId).short + '</div><div class="small muted">' + statusLine(active) + '</div></div>' + ic('right', 20) + '</a>';
    }
    h += '<div class="cats mt16">' + CATS.map(function (c) {
      return '<button class="cat' + (ui.cat === c[0] ? ' on' : '') + '" data-a="cat" data-v="' + c[0] + '">' + photo(c[1]) + '<span>' + c[0] + '</span></button>';
    }).join('') + '</div>';
    if (last && !ui.cat && R(last.restId).id) {
      h += '<div class="t-h2 mt20">Pedir de nuevo</div><div class="card mt12 row">' + photo(last.items[0] && R(last.restId).dishes.filter(function (d) { return d.id === last.items[0].id; })[0] ? R(last.restId).dishes.filter(function (d) { return d.id === last.items[0].id; })[0].img : R(last.restId).img, 'thumb') +
        '<div class="grow"><div class="b ellipsis">' + R(last.restId).name + '</div><div class="small muted ellipsis">' + last.items.map(function (i) { return i.name; }).join(' + ') + ' · ' + fmt(last.total) + '</div></div>' +
        '<button class="btn btn-soft btn-sm" data-a="reorder" data-id="' + last.id + '">Repetir</button></div>';
    }
    h += '<div class="row between mt24"><div class="t-h2">' + (ui.cat ? ui.cat : 'Cerca de ti') + '</div><div class="small muted">' + (ui.cat ? '<button class="link" data-a="cat" data-v="">Ver todos</button>' : openN + ' abiertos') + '</div></div><div class="mt12">' +
      (list.length ? list.map(restCard).join('') : '<div class="empty">' + (ui.cat ? 'Todavía no hay restaurantes con ' + ui.cat + '.' : ONLINE && !ui.synced ? 'Cargando restaurantes…' : 'Pronto vas a ver aquí los restaurantes de Villanueva.') + '</div>') + '</div></div>';
    return h + cartBar(true) + tabs('cliente', 'inicio');
  }
  function searchResults() {
    var q = ui.q.trim().toLowerCase();
    if (!q) return '<div class="small muted mt16">Prueba: carne, pizza, empanadas, jugo…</div>' + '<div class="chips mt12">' + ['Carne', 'Pizza', 'Empanadas', 'Hamburguesa', 'Jugo'].map(function (s) { return '<button class="chip" data-a="qset" data-v="' + s + '">' + s + '</button>'; }).join('') + '</div>';
    var out = [];
    shown().forEach(function (r) {
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
    if (ONLINE && !r.id) return ui.synced ? '<div class="screen">' + topbar('Restaurante', '/inicio') + '<div class="empty">No encontramos este restaurante.</div></div>' : scrLoading('Restaurante');
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
    if (!r.dishes.length) h += '<div class="empty">Este restaurante aún no tiene menú.</div>';
    h += '</div><div class="small muted mt16 center">' + esc(r.address) + '</div></div></div>';
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
    h += '</div><div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="placeOrder"' + (short > 0 || !S.open[r.id] || ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Enviando pedido…' : S.open[r.id] ? 'Hacer pedido · ' + fmt(total) : 'Restaurante cerrado') + '</button></div>';
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
    var rd = riderOf(o);
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
        '<div class="pin">' + String(o.pin || '····').split('').map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="small" style="color:var(--soft-t)">Así sabemos que el pedido llegó a la persona correcta.</div></div>';
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
      if (!ONLINE) h += '<div class="demo-bar mt16"><b>Modo demo</b>En la vida real el restaurante y el domiciliario hacen el siguiente paso desde su propio celular. Aquí lo puedes hacer tú:' + next + '</div>';
      else if (o.status === 'recibido') h += '<div class="note grey mt16 center">Le avisamos a ' + esc(r.short) + '. Esta pantalla se actualiza sola.</div>';
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
      '<div class="card row"><div class="avatar" style="background:' + c[0] + ';color:' + c[1] + '">' + initials(S.user.name) + '</div><div class="grow"><div class="t-h3">' + esc(S.user.name) + '</div><div class="small muted">' + (S.user.phone ? phoneFmt(S.user.phone) + ' · ' : '') + 'Villanueva</div></div></div>' +
      '<div class="card mt12"><div class="field"><label class="label" for="pn">Nombre</label><input class="input" id="pn" data-m="user.name" value="' + esc(S.user.name) + '"></div>' +
      '<div class="field"><label class="label" for="pp">Celular / WhatsApp</label><input class="input" id="pp" data-m="user.phone" inputmode="tel" value="' + esc(S.user.phone) + '"></div>' +
      '<div class="field"><label class="label" for="pa">Dirección</label><textarea class="input" id="pa" data-m="user.address" rows="2">' + esc(S.user.address) + '</textarea></div>' +
      '<button class="btn btn-green btn-sm btn-block mt12" data-a="saveProfile">Guardar</button></div>' +
      '<div class="card mt12" style="padding:4px 14px">' +
      '<a class="menu-row" href="#/promo"><span class="mi">' + ic('qr', 20) + '</span><span class="grow">Recomienda y gana</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/dom"><span class="mi">' + ic('bike', 20) + '</span><span class="grow">Quiero ser domiciliario</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/rest"><span class="mi">' + ic('store', 20) + '</span><span class="grow">Panel del restaurante</span>' + ic('right', 18) + '</a>' +
      '<a class="menu-row" href="#/"><span class="mi">' + ic('swap', 20) + '</span><span class="grow">Cambiar de rol</span>' + ic('right', 18) + '</a>' +
      (ONLINE ? '' : '<button class="menu-row" data-a="resetAsk"><span class="mi" style="background:#FDE8E6;color:#A1291B">' + ic('refresh', 20) + '</span><span class="grow">Reiniciar datos de demo</span></button>') + '</div>' +
      installCard() + '<div class="xs muted center mt16">Pido y Ido · ' + (ONLINE ? 'Villanueva, Casanare' : 'prototipo de demostración') + '</div></div>' + tabs('cliente', 'perfil');
  }

  // ---------- Restaurant ----------
  function restHeader(r) {
    var open = S.open[r.id];
    return '<div class="row">' + photo(r.img, 'thumb s44') + '<button class="grow" style="text-align:left" data-a="pickRest"><div class="xs muted">Panel del restaurante</div><div class="b row" style="gap:4px"><span class="ellipsis">' + r.name + '</span>' + ic('down', 16) + '</div></button>' +
      '<button class="toggle" data-a="toggleOpen" style="background:' + (open ? 'var(--gtint)' : 'var(--track)') + ';color:' + (open ? 'var(--green)' : 'var(--muted)') + '">' + (open ? 'Abierto' : 'Cerrado') +
      '<span class="tr" style="background:' + (open ? 'var(--green)' : '#C9C1B7') + ';--k:' + (open ? '19px' : '3px') + '"></span></button></div>';
  }
  function scrRest(query) {
    if (!ONLINE && query && query.r && RESTAURANTS.some(function (x) { return x.id === query.r; })) { S.restId = query.r; save(); }
    var r = R(S.restId);
    var mine = S.orders.filter(function (o) { return o.restId === r.id; });
    var groups = {
      nuevos: mine.filter(function (o) { return o.status === 'recibido'; }),
      preparando: mine.filter(function (o) { return o.status === 'preparando' || o.status === 'listo'; }),
      camino: mine.filter(function (o) { return o.status === 'en_camino'; }),
      hechos: mine.filter(function (o) { return ['entregado', 'rechazado', 'cancelado'].indexOf(o.status) >= 0; })
    };
    var today = mine.filter(function (o) { return isToday(o.createdAt) && ['rechazado', 'cancelado'].indexOf(o.status) < 0; });
    var base = ONLINE ? [0, 0] : { llanero: [14, 412000], plaza: [9, 318000], rosa: [11, 276000] }[r.id] || [0, 0];
    var doneT = today.filter(function (o) { return o.deliveredAt && o.createdAt; });
    var avgMin = ONLINE ? (doneT.length ? Math.round(doneT.reduce(function (a, o) { return a + (o.deliveredAt - o.createdAt); }, 0) / doneT.length / 60000) : '—') : 24;
    var h = '<div class="screen has-tabs">' + restHeader(r) +
      '<div class="stats mt16"><div class="stat"><div class="xs muted">Hoy</div><div class="v">' + (base[0] + today.length) + '</div><div class="xs muted">pedidos</div></div>' +
      '<div class="stat"><div class="xs muted">Ventas</div><div class="v">$' + Math.round((base[1] + today.reduce(function (a, o) { return a + o.total; }, 0)) / 1000) + 'k</div><div class="xs muted">COP</div></div>' +
      '<div class="stat"><div class="xs muted">Promedio</div><div class="v">' + avgMin + '</div><div class="xs muted">min</div></div></div>' +
      (ONLINE && !r.dishes.length ? '<a class="note amber mt12" style="display:block" href="#/rest/menu"><b>Agrega tu menú</b> para que los clientes te encuentren. Toca aquí.</a>' : '') +
      (S.open[r.id] ? '' : '<div class="note amber mt12"><b>Estás cerrado.</b> ' + (ONLINE ? 'Cuando quieras recibir pedidos, toca <b>Abierto</b> arriba.' : 'Los clientes ven tu menú, pero no pueden pedir.') + '</div>') +
      '<div class="chips scroll mt16">' + [['nuevos', 'Nuevos'], ['preparando', 'Preparando'], ['camino', 'En camino'], ['hechos', 'Entregados']].map(function (t) {
        var n = groups[t[0]].length;
        return '<button class="chip' + (ui.rtab === t[0] ? ' on' : '') + '" data-a="rtab" data-v="' + t[0] + '">' + t[1] + (n ? ' <span class="cnt">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div><div class="mt12">';
    var list = groups[ui.rtab];
    if (!list.length) {
      var emptyTxt = { nuevos: 'No hay pedidos nuevos. Cuando llegue uno, aparece aquí (y te avisamos por WhatsApp).', preparando: 'Nada en preparación.', camino: 'Ningún pedido en camino.', hechos: 'Todavía no hay pedidos terminados.' }[ui.rtab];
      h += '<div class="empty"><div class="ic">' + ic('receipt', 26) + '</div>' + emptyTxt + '</div>';
      if (ui.rtab === 'nuevos' && ONLINE) h += '<div class="note grey center">Deja esta pantalla abierta: suena cuando llega un pedido.</div>';
      if (ui.rtab === 'nuevos' && !ONLINE) h += '<div class="demo-bar"><b>Modo demo</b>Haz un pedido como cliente y vuelve aquí para aceptarlo.<a class="btn btn-outline btn-block mt8" href="#/r/' + r.id + '">Pedir como cliente</a></div>';
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
      var rd = riderOf(o);
      return '<div class="order-card"><div class="ob">' + head + '<div class="small mt8">' + ic('bike', 14) + ' ' + (rd ? esc(rd.name) + ' · salió ' + ago(o.sentAt) : 'Lo lleva alguien del restaurante') + '</div>' + cust +
        '<div class="row mt12" style="gap:8px">' + (rd ? (ONLINE ? '<a class="btn btn-outline btn-sm" style="flex:1" target="_blank" rel="noopener" href="' + waLink(rd.phone, riderMsg(o)) + '">Reenviar</a>' : '<a class="btn btn-outline btn-sm" style="flex:1" href="#/wa/' + o.id + '">Ver chat</a>') : '') + '<button class="btn btn-green btn-sm" style="flex:1" data-a="pinAsk" data-id="' + o.id + '">Confirmar entrega</button></div></div></div>';
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
      (ONLINE ? 'Al entregar, pide al cliente el código de 4 números y confírmalo aquí: ' + location.href.split('#')[0] + '#/entrega/' + o.dbId
        : 'Al entregar, pide el código de 4 números y responde: ENTREGADO + código');
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
      '<button class="wa-qr" data-a="waQuick" data-id="' + id + '" data-v="Voy en camino">Voy en camino</button><a class="wa-qr" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQ) + '">Ver en el mapa</a></div>';
    h += chat.map(function (m) {
      return '<div class="bubble' + (m.out ? ' out' : '') + '">' + (m.ok ? '<span class="green">' + ic('check', 16, { sw: 3 }) + '</span> ' : '') + esc(m.text) + '<div class="time">' + hora(m.t) + (m.out ? ' ✓✓' : '') + '</div></div>';
    }).join('');
    h += '</div>' + (o.status === 'en_camino' ? '<div class="wa-input"><input id="wamsg" placeholder="Escribe: ENTREGADO ' + '1234" autocomplete="off" data-enter="waSend" data-id="' + id + '"><button data-a="waSend" data-id="' + id + '" aria-label="Enviar">' + ic('send', 20) + '</button></div>'
      : '<div class="wa-input" style="justify-content:center"><a class="btn btn-outline btn-sm" href="#/pedido/' + id + '">Ver el pedido como cliente</a></div>') + '</div>';
    return h;
  }

  // ---------- Restaurant: menu + data (online) ----------
  var PHOTOS = [['Asado', IMG.asado], ['Carne', IMG.carne], ['Pollo', IMG.pollo], ['Empanadas', IMG.emp], ['Arepas', IMG.arepa], ['Hamburguesa', IMG.burger], ['Pizza', IMG.pizza], ['Pincho', IMG.pincho], ['Jugo', IMG.jugo]];
  function photoPick(cur, action) {
    return '<div class="chips mt8" style="gap:8px">' + PHOTOS.map(function (p) {
      var on = cur === p[1];
      return '<button data-a="' + action + '" data-v="' + esc(p[1]) + '" aria-label="' + p[0] + '" style="padding:0;border-radius:12px;overflow:hidden;width:56px;height:56px;border:' + (on ? '3px solid var(--orange)' : '1.5px solid var(--border)') + '">' + photo(p[1], '', 'width:100%;height:100%') + '</button>';
    }).join('') + '</div>';
  }
  function scrRestMenu() {
    var r = R(S.restId);
    var f = ui.rm && ui.rm.id === r.id ? ui.rm : (ui.rm = { id: r.id, name: r.name, sub: r.sub, address: r.address, phone: r.phone, nequi: r.nequi, fee: r.fee, min: r.min, eta: r.eta, img: r.img, cats: r.cats.slice() });
    var chip = function (key, val, label) { return '<button class="chip sm' + (String(f[key]) === String(val) ? ' on' : '') + '" data-a="rmSet" data-k="' + key + '" data-v="' + esc(val) + '">' + label + '</button>'; };
    var h = '<div class="screen has-tabs">' + restHeader(r) + '<h1 class="t-title mt20" style="font-size:22px">Tu menú</h1>' +
      '<div class="small muted mt4">Lo que ven los clientes. Los cambios se ven al instante.</div><div class="card mt12" style="padding:4px 14px">' +
      (r.dishes.length ? r.dishes.map(function (d) {
        return '<div class="list-row">' + photo(d.img, 'thumb s44') + '<div class="grow"><div class="b ellipsis">' + esc(d.name) + '</div><div class="small muted ellipsis">' + fmt(d.price) + (d.desc ? ' · ' + esc(d.desc) : '') + '</div></div>' +
          '<button class="icon-btn" style="width:40px;height:40px;box-shadow:none;background:var(--track)" data-a="dishDel" data-v="' + esc(d.id) + '" aria-label="Quitar">' + ic('x', 18) + '</button></div>';
      }).join('') : '<div class="empty">Aún no hay platos. Agrega el primero.</div>') + '</div>' +
      '<button class="dashed-btn mt12" data-a="dishForm">' + ic('plus', 18) + ' Agregar un plato</button>' +
      '<h2 class="t-h2 mt24">Datos del restaurante</h2><div class="card mt12">' +
      '<div class="field"><label class="label" for="rm1">Nombre</label><input class="input" id="rm1" data-m="ui.rm.name" value="' + esc(f.name) + '"></div>' +
      '<div class="field"><label class="label" for="rm2">Qué vendes (corto)</label><input class="input" id="rm2" data-m="ui.rm.sub" value="' + esc(f.sub) + '" placeholder="Carne a la llanera · Pollo asado"></div>' +
      '<div class="field"><label class="label" for="rm3">Dirección</label><input class="input" id="rm3" data-m="ui.rm.address" value="' + esc(f.address) + '"></div>' +
      '<div class="row" style="gap:10px"><div class="grow field"><label class="label" for="rm4">WhatsApp</label><input class="input" id="rm4" data-m="ui.rm.phone" inputmode="tel" value="' + esc(f.phone) + '"></div>' +
      '<div class="grow field"><label class="label" for="rm5">Nequi / Daviplata</label><input class="input" id="rm5" data-m="ui.rm.nequi" inputmode="tel" value="' + esc(f.nequi) + '"></div></div>' +
      '<div class="label mt8">Domicilio</div><div class="chips">' + [0, 2000, 3000, 4000, 5000].map(function (v) { return chip('fee', v, v ? fmt(v) : 'Gratis'); }).join('') + '</div>' +
      '<div class="label mt12">Pedido mínimo</div><div class="chips">' + [0, 10000, 15000, 20000].map(function (v) { return chip('min', v, v ? fmt(v) : 'Sin mínimo'); }).join('') + '</div>' +
      '<div class="label mt12">Tiempo de entrega</div><div class="chips">' + ['20–30 min', '30–40 min', '40–60 min'].map(function (v) { return chip('eta', v, v); }).join('') + '</div>' +
      '<div class="label mt12">Categorías</div><div class="chips">' + CATS.map(function (c) { return '<button class="chip sm' + (f.cats.indexOf(c[0]) >= 0 ? ' on' : '') + '" data-a="rmCat" data-v="' + c[0] + '">' + c[0] + '</button>'; }).join('') + '</div>' +
      '<div class="label mt12">Foto principal</div>' + photoPick(f.img, 'rmImg') +
      '<button class="btn btn-green btn-block mt16" data-a="rmSave"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Guardando…' : 'Guardar datos') + '</button></div>' +
      '<button class="btn btn-ghost btn-block mt12" data-a="restLogout">Cerrar sesión</button></div>' + tabs('rest', 'menu');
    return h;
  }
  function scrEntrega(dbId) {
    var e = ui.ent && ui.ent.id === dbId ? ui.ent : null;
    if (!e) {
      ui.ent = { id: dbId, info: null, msg: '', done: false };
      CLOUD.orderForRider(+dbId).then(function (info) { if (ui.ent && ui.ent.id === dbId) { ui.ent.info = info || { missing: true }; render(); } }, function (err) { if (ui.ent) { ui.ent.info = { missing: true }; ui.ent.msg = errTxt(err); render(); } });
      e = ui.ent;
    }
    var i = e.info;
    var h = '<div class="screen has-cta">' + topbar('Confirmar entrega', null, 'Pido y Ido · domiciliario');
    if (!i) return h + '<div class="empty">Cargando…</div></div>';
    if (i.missing) return h + '<div class="empty">No encontramos este pedido.' + (e.msg ? '<br>' + esc(e.msg) : '') + '</div></div>';
    h += '<div class="card"><div class="b">Domicilio #' + String(i.id).padStart(4, '0') + ' · ' + esc(i.rest) + '</div><div class="small muted mt4">Para ' + esc(i.name) + ' · ' + esc(i.address) + '</div></div>';
    if (e.done || i.status === 'entregado') return h + '<div class="card mt12 center"><div class="big-check">' + ic('check', 44, { sw: 2.6 }) + '</div><div class="t-h2 mt12">¡Pedido entregado!</div><div class="small muted mt4">Gracias. El restaurante ya lo ve como entregado.</div></div></div>';
    if (['listo', 'en_camino'].indexOf(i.status) < 0) return h + '<div class="note amber mt12">Este pedido no está en camino (' + esc(STATUS_TXT[i.status] || i.status) + ').</div></div>';
    return h + '<div class="card mt12"><div class="b">Pídele al cliente el código de 4 números</div><input class="input mt12 center num" id="entPin" inputmode="numeric" maxlength="4" placeholder="• • • •" data-enter="entregaDo" style="font-size:28px;letter-spacing:12px">' +
      '<div class="err-msg center">' + esc(e.msg || '') + '</div></div></div>' +
      '<div class="cta-wrap"><button class="btn btn-primary btn-xl btn-block" data-a="entregaDo"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Revisando…' : 'Confirmar entrega') + '</button></div>';
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
        return '<button class="card flat row grow" style="padding:10px;gap:8px;' + (on ? 'border:2px solid var(--orange)' : '') + '" data-a="promoRest" data-v="' + x.id + '">' + photo(x.img, 'thumb', 'width:36px;height:36px;border-radius:999px') + '<span class="small b ellipsis" style="text-align:left">' + x.short + '</span></button>';
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
      case 'confirmar': return scrConfirmar();
      case 'pedido': return scrPedido(p[1]);
      case 'calificar': return scrCalificar(p[1]);
      case 'entrega': return ONLINE ? scrEntrega(p[1]) : scrStart();
      case 'rest':
        if (p[1] === 'registro') return scrRestRegistro();
        if (ONLINE && p[1] === 'login') return CLOUD.restUid() ? (setTimeout(function () { go('/rest'); }, 0), scrLoading()) : scrRestLogin();
        if (ONLINE && p[1] === 'bolsa' && !S.restId) return scrBolsa(false);
        if (ONLINE && !ui.synced && !S.restId) return scrLoading('Panel del restaurante');
        if (ONLINE && !CLOUD.restUid() && ui.synced) return scrRestLogin();
        if (ONLINE && !S.restId) return scrRestRegistro();
        if (ONLINE && p[1] === 'menu') return scrRestMenu();
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
    ui.pendingRender = false;
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
      var finish = function () {
        S.orders.unshift(o);
        S.cart = { restId: null, items: {}, mode: 'dom' }; S.co.note = ''; S.co.cash = 'exact'; S.co.geo = null;
        save(); go('/pedido/' + o.id); toast('¡Pedido enviado a ' + r.short + '!');
      };
      if (!ONLINE) return finish();
      if (ui.busy) return;
      ui.busy = true; render();
      CLOUD.placeOrder({ rest_id: r.id, items: o.items.map(function (i) { return { id: i.id, qty: i.qty }; }), mode: o.mode, note: o.note, pay: o.pay, cash_given: o.cashGiven,
        customer: o.customer, geo: o.geo, ref_slug: o.ref ? o.ref.slug : null })
        .then(function (res) { ui.busy = false; o.dbId = res.id; o.id = String(res.id).padStart(4, '0'); o.pin = res.pin; finish(); sync(); },
          function (e) { ui.busy = false; render(); toast(errTxt(e)); sync(); });
    },
    cancelOrder: function (el) { var o = order(el.dataset.id); if (o && o.status === 'recibido') { o.status = 'cancelado'; save(); go('/pedidos'); toast('Pedido cancelado'); if (ONLINE) push(CLOUD.cancelOrder(o.dbId)); } },
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
      if (ONLINE) push(CLOUD.rateOrder(o.dbId, o.rating, o.tags));
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
          '<a class="btn btn-outline btn-block mt16" href="#/rest/menu">Editar menú y datos</a><button class="btn btn-ghost btn-block mt8" data-a="restLogout">Cerrar sesión</button>');
        return;
      }
      sheet('<div class="t-h2">¿Qué restaurante eres?</div><div class="small muted mt4">En la demo puedes ver el panel de cualquiera.</div><div class="mt12">' + RESTAURANTS.map(function (r) {
        return '<button class="radio-row' + (S.restId === r.id ? ' on' : '') + '" data-a="setRest" data-v="' + r.id + '">' + photo(r.img, 'thumb s44') + '<span class="grow b">' + r.name + '</span><span class="ring"></span></button>';
      }).join('') + '</div>');
    },
    setRest: function (el) { S.restId = el.dataset.v; save(); sheet(null); render(); },
    toggleOpen: function () {
      if (ONLINE && !S.open[S.restId] && !R(S.restId).dishes.length) { toast('Primero agrega tu menú'); go('/rest/menu'); return; }
      S.open[S.restId] = !S.open[S.restId]; R(S.restId).open = S.open[S.restId]; save(); render(); toast(S.open[S.restId] ? 'Abierto: ya recibes pedidos' : 'Cerrado: no recibes pedidos');
      if (ONLINE) push(CLOUD.updateRest({ open: S.open[S.restId] }));
    },
    rtab: function (el) { ui.rtab = el.dataset.v; render(); },
    etaPick: function (el) { ui.choose['eta' + el.dataset.id] = +el.dataset.v; render(); },
    accept: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      o.status = 'preparando'; o.etaMin = ui.choose['eta' + o.id] || 30; o.acceptedAt = now(); save();
      if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'preparando', eta_min: o.etaMin, accepted_at: new Date().toISOString() }));
      ui.rtab = 'preparando'; render(); toast('Aceptado. ' + first(o.customer.name) + ' ya lo ve en su pedido');
    },
    reject: function (el) {
      var id = el.dataset.id;
      sheet('<div class="t-h2">¿Por qué no puedes aceptarlo?</div><div class="mt12">' + ['Estamos muy llenos ahora', 'Se acabó un producto', 'No llegamos a esa dirección', 'Ya vamos a cerrar'].map(function (x) {
        return '<button class="radio-row" data-a="rejectDo" data-id="' + id + '" data-v="' + x + '"><span class="ring"></span><span class="grow">' + x + '</span></button>';
      }).join('') + '</div><button class="btn btn-ghost btn-block mt8" data-a="closeSheet">Volver</button>');
    },
    rejectDo: function (el) { var o = order(el.dataset.id); if (!o) return; o.status = 'rechazado'; o.rejectReason = el.dataset.v + '.'; save(); if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'rechazado', reject_reason: o.rejectReason })); sheet(null); render(); toast('Pedido rechazado. Le avisamos al cliente.'); },
    ready: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      o.status = 'listo'; save();
      if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'listo' }));
      if (o.mode === 'dom') go('/rest/enviar/' + o.id); else { render(); toast('Le avisamos que ya puede recogerlo'); }
    },
    choose: function (el) { ui.choose['r' + el.dataset.id] = el.dataset.v; render(); },
    sendRider: function (el) {
      var o = order(el.dataset.id); if (!o) return;
      var sel = ui.choose['r' + o.id] || 'yo';
      o.riderId = sel; o.status = 'en_camino'; o.sentAt = now();
      var snap = sel === 'yo' ? null : S.riders[sel];
      if (ONLINE) push(CLOUD.updateOrder(o.dbId, { status: 'en_camino', rider_id: sel, rider: snap ? { name: snap.name, phone: snap.phone, vehicle: snap.vehicle || 'Moto' } : null, sent_at: new Date().toISOString() }));
      if (sel === 'yo') { save(); ui.rtab = 'camino'; go('/rest'); toast('En camino. Al entregar, pide el código al cliente.'); return; }
      var rd = S.riders[sel];
      S.chats[o.id] = S.chats[o.id] || [];
      save(); ui.rtab = 'camino';
      var msg = riderMsg(o);
      sheet('<div class="t-h2">Pedido listo para ' + esc(rd.name) + '</div><div class="small muted mt4">Así le llega por WhatsApp:</div>' +
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
          if (res === 'ok' || res === 'ya_entregado') { deliver(o); sheet(null); ui.rtab = 'hechos'; render(); toast('Pedido #' + o.id + ' entregado'); sync(); return; }
          var e = document.getElementById('pinErr'); if (e) e.textContent = PIN_TXT[res] || 'No se pudo confirmar.';
        }, function (err) { el.disabled = false; toast(errTxt(err)); });
        return;
      }
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
    rmSet: function (el) { var k = el.dataset.k; ui.rm[k] = (k === 'fee' || k === 'min') ? +el.dataset.v : el.dataset.v; render(); },
    rmCat: function (el) { var c = ui.rm.cats, i = c.indexOf(el.dataset.v); if (i >= 0) c.splice(i, 1); else c.push(el.dataset.v); render(); },
    rmImg: function (el) { ui.rm.img = el.dataset.v; render(); },
    rmSave: function () {
      var f = ui.rm; if (!f || ui.busy) return;
      if (!String(f.name || '').trim()) { toast('Escribe el nombre'); return; }
      var fields = { name: f.name.trim(), short: f.name.trim().replace(/^(asadero|restaurante|pizzería|pizzeria|cafetería|cafeteria)\s+/i, ''), sub: String(f.sub || '').trim(), address: String(f.address || '').trim(),
        phone: String(f.phone || '').replace(/\D/g, ''), nequi: String(f.nequi || '').trim(), fee: +f.fee || 0, min: +f.min || 0, eta: f.eta, img: f.img, cats: f.cats.slice() };
      ui.busy = true; render();
      CLOUD.updateRest(fields).then(function () { ui.busy = false; Object.assign(R(S.restId), fields); ui.rm = null; render(); toast('Datos guardados'); sync(); },
        function (e) { ui.busy = false; render(); toast(errTxt(e)); });
    },
    dishForm: function () {
      ui.dish = { img: IMG.asado };
      sheet('<div class="t-h2">Agregar un plato</div>' +
        '<label class="label mt12" for="dn">Nombre</label><input class="input" id="dn" placeholder="Carne a la llanera" autocomplete="off">' +
        '<label class="label mt12" for="dd">Descripción (opcional)</label><input class="input" id="dd" placeholder="300 g, yuca, papa y ají" autocomplete="off">' +
        '<label class="label mt12" for="dp">Precio</label><input class="input" id="dp" inputmode="numeric" placeholder="25000">' +
        '<div class="label mt12">Foto</div><div id="dishPh">' + photoPick(ui.dish.img, 'dishImg') + '</div>' +
        '<div id="dErr" class="err-msg"></div><button class="btn btn-primary btn-block mt16" data-a="dishAdd">Agregar al menú</button>');
    },
    dishImg: function (el) { ui.dish.img = el.dataset.v; var w = document.getElementById('dishPh'); if (w) w.innerHTML = photoPick(ui.dish.img, 'dishImg'); },
    dishAdd: function (el) {
      var n = document.getElementById('dn').value.trim(), d = document.getElementById('dd').value.trim(), pr = +String(document.getElementById('dp').value).replace(/\D/g, '');
      if (!n) { document.getElementById('dErr').textContent = 'Escribe el nombre del plato.'; return; }
      if (!pr || pr < 500) { document.getElementById('dErr').textContent = 'Escribe el precio en pesos (ej.: 25000).'; return; }
      var r = R(S.restId), dishes = r.dishes.concat([{ id: 'd' + now().toString(36), name: n, desc: d, price: pr, img: ui.dish.img, top: !r.dishes.length }]);
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
      CLOUD.deliver(+e.id, v, false).then(function (res) {
        ui.busy = false;
        if (res === 'ok' || res === 'ya_entregado') { e.done = true; e.msg = ''; } else e.msg = PIN_TXT[res] || 'No se pudo confirmar.';
        render();
      }, function (err) { ui.busy = false; e.msg = errTxt(err); render(); });
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

  // ---------- Online sync ----------
  var PIN_TXT = { incorrecto: 'Código incorrecto. Revisa con el cliente.', bloqueado: 'Demasiados intentos. El restaurante debe llamar al cliente.', cerrado: 'Este pedido ya no está en camino.', no_existe: 'No encontramos este pedido.' };
  function errTxt(e) {
    var m = String((e && (e.message || e.error_description)) || e || '');
    if (/closed/.test(m)) return 'El restaurante acaba de cerrar. Intenta más tarde.';
    if (/below_min/.test(m)) return 'No alcanza el pedido mínimo.';
    if (/dish_gone/.test(m)) return 'Un plato ya no está en el menú. Revisa tu carrito.';
    if (/already registered|already_exists|duplicate key.*users/i.test(m)) return 'Ese número ya tiene cuenta. Inicia sesión.';
    if (/confirm_email_on/.test(m)) return 'Falta un ajuste: en Supabase apaga "Confirm email".';
    if (/anonymous/i.test(m)) return 'Falta un ajuste: en Supabase activa "Anonymous sign-ins".';
    if (/fetch|network|Failed|Load failed/i.test(m)) return 'Sin conexión. Revisa tu internet e intenta otra vez.';
    return 'No se pudo guardar (' + m.slice(0, 80) + ')';
  }
  function push(p) { if (p && p.then) p.then(function () { sync(); }, function (e) { console.warn(e); toast(errTxt(e)); sync(true); }); }
  function regLive() {
    var f = ui.reg || {}, logged = !!CLOUD.restUid(), err = {}, ph = String(f.phone || '').replace(/\D/g, '');
    if (!String(f.name || '').trim()) err.name = 1;
    if (!logged && ph.length !== 10) err.phone = 1;
    if (String(f.addr || '').trim().length < 5) err.addr = 1;
    if (!logged && String(f.pass || '').length < 6) err.pass = 1;
    ui.regErr = err;
    ui.regMsg = err.name ? 'Escribe el nombre del restaurante.' : err.phone ? 'El WhatsApp debe tener 10 números.' : err.addr ? 'Escribe la dirección.' : err.pass ? 'La clave debe tener mínimo 6 letras o números.' : '';
    if (ui.regMsg || ui.busy) { render(); return; }
    var name = f.name.trim();
    var slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) + '-' + Math.random().toString(36).slice(2, 6);
    var data = { id: slug, name: name, short: name.replace(/^(asadero|restaurante|pizzería|pizzeria|cafetería|cafeteria)\s+/i, ''), sub: '', img: IMG.asado, cats: [], address: f.addr.trim(), phone: ph, nequi: ph ? phoneFmt(ph) : '', dishes: [], open: false };
    ui.busy = true; render();
    (logged ? CLOUD.createRest(data) : CLOUD.restSignup(ph, f.pass, data)).then(function () { return sync(true); }).then(function () {
      ui.busy = false; ui.reg = null; ui.regErr = null; S.role = 'rest'; S.seen = S.seen || {}; S.seen.rest = true; save();
      go('/rest/menu'); toast('¡Bienvenido! Ahora agrega tu menú.');
    }, function (e) { ui.busy = false; ui.regMsg = errTxt(e); render(); });
  }
  var syncing = null, lastSig = '', seenNew = null;
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
    S.restId = d.myRest;
    save();
    // new order sound for the restaurant
    var fresh = d.orders.filter(function (o) { return o.restId === d.myRest && o.status === 'recibido'; }).map(function (o) { return o.id; });
    if (seenNew) {
      var nuevos = fresh.filter(function (id) { return seenNew.indexOf(id) < 0; });
      if (nuevos.length) { beep(); toast(nuevos.length > 1 ? nuevos.length + ' pedidos nuevos' : '¡Pedido nuevo #' + nuevos[0] + '!'); }
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
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.m) { setPath(t.dataset.m, t.value); t.classList.remove('err'); }
    if (t.dataset.live === 'q') { ui.q = t.value; var res = document.getElementById('results'); if (res) res.innerHTML = searchResults(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.dataset.file && t.files && t.files[0]) { (t.dataset.file === 'menu' ? ui.reg : ui.signup)[t.dataset.file] = true; render(); toast('Foto agregada'); }
  });
  document.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (ev.key === 'Enter' && t.dataset && t.dataset.enter) { ev.preventDefault(); A[t.dataset.enter](t); }
  });
  window.addEventListener('hashchange', render);
  if (!ONLINE) window.addEventListener('storage', function (e) { if (e.key === KEY) { S = load(); render(); } });
  if (ONLINE) {
    CLOUD.live(function () { sync(); });
    setInterval(function () { if (document.visibilityState !== 'hidden') sync(); }, 10000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') sync(); });
    window.addEventListener('online', function () { sync(); });
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ui.installEvt = e; if (parse().parts.length === 0) render(); });
  setInterval(function () {
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
})();
