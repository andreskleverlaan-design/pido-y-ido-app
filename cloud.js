/* Pido y Ido: conexión con la base de datos en línea (Supabase).
   Si config.js no tiene datos, la app sigue en modo demo (todo en este celular). */
(function () {
  'use strict';
  var cfg = window.PYI_CONFIG || {};
  var forceDemo = /[?&]demo\b/.test(location.search);
  if (!cfg.supabaseUrl || !cfg.supabaseKey || forceDemo || !window.supabase) { window.PYI_CLOUD = null; return; }

  // Two separate sessions on one phone: the customer (automatic, no sign-up) and the restaurant (phone + password).
  function mk(key) {
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { storageKey: key, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  }
  var cust = mk('pyi-cust'), rest = mk('pyi-rest');
  var custUid = null, restUid = null, myRest = null, promoSlug = null;

  function phoneEmail(phone) { return 'r' + String(phone).replace(/\D/g, '').slice(-10) + '@pidoyido.app'; }
  function ms(t) { return t ? new Date(t).getTime() : null; }
  function pad(id) { return String(id).padStart(4, '0'); }
  function check(r) { if (r.error) { var e = new Error(r.error.message || 'error'); e.code = r.error.code; e.raw = r.error; throw e; } return r.data; }

  async function ensureCust() {
    if (custUid) return custUid;
    var s = (await cust.auth.getSession()).data.session;
    if (!s) s = check(await cust.auth.signInAnonymously()).session;
    custUid = s.user.id;
    return custUid;
  }
  async function restSession() {
    var s = (await rest.auth.getSession()).data.session;
    restUid = s && !s.user.is_anonymous ? s.user.id : null;
    return restUid;
  }

  function mapRest(r) {
    return {
      id: r.id, owner: r.owner, kind: r.kind || 'restaurante', name: r.name, short: r.short || r.name, sub: r.sub || '', img: r.img || '', cats: r.cats || [],
      eta: r.eta, pickup: r.pickup, min: r.min, fee: r.fee, address: r.address, phone: r.phone, nequi: r.nequi || r.phone,
      dishes: Array.isArray(r.dishes) ? r.dishes : [], open: r.open,
      rating: r.rating_count ? Number(r.rating_sum) / r.rating_count : 0, count: r.rating_count,
      lat: r.lat == null ? null : Number(r.lat), lng: r.lng == null ? null : Number(r.lng), radius: r.radius_km == null ? 3 : Number(r.radius_km),
      abre: r.abre || null, cierra: r.cierra || null, progOk: Object.prototype.hasOwnProperty.call(r, 'abre'),
      horario: Array.isArray(r.horario) && r.horario.length === 7 ? r.horario : null, horOk: Object.prototype.hasOwnProperty.call(r, 'horario')
    };
  }
  function mapOrder(o, mine, pin) {
    return {
      id: pad(o.id), dbId: o.id, restId: o.rest_id, mine: !!mine, customer: o.customer || {}, items: o.items || [],
      subtotal: o.subtotal, fee: o.fee, total: o.total, mode: o.mode, note: o.note || '', pay: o.pay, cashGiven: o.cash_given,
      pin: pin || '', status: o.status, etaMin: o.eta_min, rejectReason: o.reject_reason, riderId: o.rider_id, rider: o.rider,
      discount: o.discount || 0, paidClaimAt: ms(o.paid_claim_at),
      geo: o.geo, ref: o.ref_slug ? { slug: o.ref_slug } : null, rating: o.rating, tags: o.tags || [], wish: o.wish || '', wishImg: o.wish_img || '',
      scheduledFor: ms(o.scheduled_for), createdAt: ms(o.created_at), acceptedAt: ms(o.accepted_at), sentAt: ms(o.sent_at), deliveredAt: ms(o.delivered_at),
      riderKey: o.rider_key || '', pickedAt: ms(o.picked_at), deliveredBy: o.delivered_by || '',
      readyAt: ms(o.ready_at), payOk: o.pay_ok == null ? null : !!o.pay_ok, flags: 0
    };
  }
  function mapRider(r) {
    return { id: r.id, name: r.name, phone: r.phone, vehicle: r.vehicle, barrio: r.barrio, hours: r.hours || [], docs: r.docs || [], board: r.board, owner: r.owner };
  }

  // Everything the app shows, in one go.
  // Cerrar pedidos colgados (015-cierre.sql): como mucho una vez por minuto. Sin ese paso no pasa nada.
  var staleAt = 0;
  async function closeStale() {
    if (Date.now() - staleAt < 60000) return;
    staleAt = Date.now();
    try { await cust.rpc('close_stale'); } catch (e) {}
  }
  async function fetchAll() {
    await ensureCust();
    await restSession();
    await closeStale();
    var out = { custUid: custUid, restUid: restUid, myRest: null, restaurants: [], orders: [], riders: {}, myRiders: [], myProfile: null, reward: null };
    var q = [
      cust.from('restaurants').select('*').order('created_at'),
      cust.from('orders').select('*').eq('customer_uid', custUid).order('created_at', { ascending: false }).limit(50),
      cust.from('riders').select('*').eq('board', true).order('created_at', { ascending: false }).limit(200)
    ];
    if (restUid) q.push(rest.from('restaurants').select('id').eq('owner', restUid).limit(1));
    var res = await Promise.all(q);
    out.restaurants = check(res[0]).map(mapRest);
    var mineRows = check(res[1]);
    check(res[2]).forEach(function (r) { out.riders[r.id] = mapRider(r); if (r.owner === custUid) out.myProfile = r.id; });
    myRest = restUid ? ((check(res[3])[0] || {}).id || null) : null;
    out.myRest = myRest;

    // Premio "cada 5º pedido" (null si todavía no se pegó supabase/006-clientes-fieles.sql).
    try { var rw = await cust.rpc('my_reward'); if (!rw.error && rw.data) out.reward = rw.data; } catch (e) {}

    var pins = {};
    if (mineRows.length) {
      check(await cust.from('order_pins').select('order_id,pin').in('order_id', mineRows.map(function (o) { return o.id; }))).forEach(function (p) { pins[p.order_id] = p.pin; });
    }
    var byId = {};
    mineRows.forEach(function (o) { byId[o.id] = mapOrder(o, true, pins[o.id]); });
    if (myRest) {
      var r2 = await Promise.all([
        rest.from('orders').select('*').eq('rest_id', myRest).order('created_at', { ascending: false }).limit(100),
        rest.from('rest_riders').select('rider_id').eq('rest_id', myRest).order('created_at')
      ]);
      check(r2[0]).forEach(function (o) { if (!byId[o.id]) byId[o.id] = mapOrder(o, false); });
      // ¿Clientes con pedidos sin pagar o sin recibir? Solo para pedidos nuevos.
      var nuevos = check(r2[0]).filter(function (o) { return o.status === 'recibido'; }).map(function (o) { return o.id; });
      if (nuevos.length) try {
        var fl = await rest.rpc('order_flags', { p_ids: nuevos });
        if (!fl.error) (fl.data || []).forEach(function (x) { if (byId[x.order_id]) byId[x.order_id].flags = x.fallos || 0; });
      } catch (e) {}
      out.myRiders = check(r2[1]).map(function (x) { return x.rider_id; });
      // Mi WhatsApp y Nequi: ya no son públicos, solo los ve el dueño (006-clientes-fieles.sql).
      try {
        var ct = await rest.from('rest_contact').select('phone,nequi').eq('rest_id', myRest).maybeSingle();
        if (!ct.error && ct.data) out.restaurants.forEach(function (r) { if (r.id === myRest) { r.phone = ct.data.phone || r.phone; r.nequi = ct.data.nequi || ct.data.phone || r.nequi; } });
      } catch (e) {}
      var missing = out.myRiders.filter(function (id) { return !out.riders[id]; });
      if (missing.length) check(await rest.from('riders').select('*').in('id', missing)).forEach(function (r) { out.riders[r.id] = mapRider(r); });
    }
    out.orders = Object.keys(byId).map(function (k) { return byId[k]; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    return out;
  }

  // ---------- customer ----------
  async function placeOrder(p) { await ensureCust(); return check(await cust.rpc('place_order', { p: p })); }
  async function cancelOrder(dbId) { return check(await cust.rpc('cancel_order', { p_id: dbId })); }
  // Nequi del negocio (solo con pedido aceptado) y su teléfono (solo si lo lleva el mismo negocio y va en camino).
  async function orderContact(dbId) { await ensureCust(); return check(await cust.rpc('order_contact', { p_id: dbId })) || {}; }
  async function markPaid(dbId) { await ensureCust(); return check(await cust.rpc('mark_paid', { p_id: dbId })); }
  async function rateOrder(dbId, stars, tags) { return check(await cust.rpc('rate_order', { p_id: dbId, p_stars: stars, p_tags: tags })); }

  // ---------- delivery code (restaurant or rider link) ----------
  async function deliver(dbId, pin, asRest) {
    if (asRest && restUid) return check(await rest.rpc('deliver_order', { p_id: dbId, p_pin: pin }));
    await ensureCust(); return check(await cust.rpc('deliver_order', { p_id: dbId, p_pin: pin }));
  }
  // Enlace del domiciliario: #/entrega/<id>-<clave> (014-entrega.sql).
  async function orderForRider(dbId, key) { await ensureCust(); return check(await cust.rpc('order_for_rider', { p_id: dbId, p_key: key || '' })); }
  async function riderPicked(dbId, key) { await ensureCust(); return check(await cust.rpc('rider_picked', { p_id: dbId, p_key: key || '' })); }
  // El cliente confirma "Ya lo recibí".
  async function confirmReceived(dbId) { await ensureCust(); return check(await cust.rpc('confirm_received', { p_id: dbId })); }

  // ---------- restaurant ----------
  async function restLogin(phone, pass) {
    var r = await rest.auth.signInWithPassword({ email: phoneEmail(phone), password: pass });
    check(r); restUid = r.data.user.id; return restUid;
  }
  async function restSignup(phone, pass, data) {
    var r = await rest.auth.signUp({ email: phoneEmail(phone), password: pass });
    check(r);
    if (!r.data.session) throw new Error('confirm_email_on');
    restUid = r.data.user.id;
    return createRest(data);
  }
  async function createRest(data) {
    var row = Object.assign({ owner: restUid }, data);
    check(await rest.from('restaurants').insert(row));
    myRest = row.id;
    return row.id;
  }
  async function restLogout() { await rest.auth.signOut(); restUid = null; myRest = null; }
  async function updateRest(fields) { return check(await rest.from('restaurants').update(fields).eq('id', myRest)); }
  async function updateOrder(dbId, fields) { return check(await rest.from('orders').update(fields).eq('id', dbId)); }
  // Nequi / Daviplata recibido o no, y cerrar sin entregar (015-cierre.sql).
  async function payOk(dbId, ok) { return check(await rest.rpc('rest_pay_ok', { p_id: dbId, p_ok: !!ok })); }
  async function notDelivered(dbId, reason) { return check(await rest.rpc('rest_not_delivered', { p_id: dbId, p_reason: reason || '' })); }
  async function addMyRider(r) {
    var row = check(await rest.from('riders').insert({ owner: restUid, name: r.name, phone: r.phone, vehicle: r.vehicle, barrio: r.barrio || '', board: false }).select().single());
    check(await rest.from('rest_riders').insert({ rest_id: myRest, rider_id: row.id }));
    return mapRider(row);
  }
  async function linkRider(id) { return check(await rest.from('rest_riders').insert({ rest_id: myRest, rider_id: id })); }
  async function unlinkRider(id, ownPrivate) {
    check(await rest.from('rest_riders').delete().eq('rest_id', myRest).eq('rider_id', id));
    if (ownPrivate) check(await rest.from('riders').delete().eq('id', id).eq('owner', restUid));
  }

  // Restaurant's own photo (cover or dish) -> public URL. Needs the 'fotos' bucket (supabase/003-fotos.sql).
  async function uploadPhoto(blob) {
    if (!restUid) throw new Error('not_logged');
    var path = restUid + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.jpg';
    check(await rest.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false }));
    return rest.storage.from('fotos').getPublicUrl(path).data.publicUrl;
  }

  // ---------- shops: free order (list photo is private: only the customer and that shop can open it) ----------
  async function uploadList(blob) {
    await ensureCust();
    var path = custUid + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.jpg';
    check(await cust.storage.from('listas').upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
    return path;
  }
  async function listUrl(path, asRest) {
    var c = asRest && restUid ? rest : cust;
    return check(await c.storage.from('listas').createSignedUrl(path, 3600)).signedUrl;
  }
  async function priceOrder(dbId, amount, eta) { return check(await rest.rpc('price_order', { p_id: dbId, p_amount: amount, p_eta: eta })); }

  // ---------- rider board profile ----------
  async function saveProfile(id, p) {
    await ensureCust();
    var row = { name: p.name, phone: p.phone, barrio: p.barrio, vehicle: p.vehicle, hours: p.hours, docs: p.docs, board: true };
    if (id) return mapRider(check(await cust.from('riders').update(row).eq('id', id).select().single()));
    row.owner = custUid;
    return mapRider(check(await cust.from('riders').insert(row).select().single()));
  }
  async function deleteProfile(id) { return check(await cust.from('riders').delete().eq('id', id)); }

  // ---------- promoter ----------
  async function ensurePromoter(wanted) {
    if (promoSlug) return promoSlug;
    await ensureCust();
    var have = check(await cust.from('promoters').select('slug').eq('owner', custUid));
    if (have.length) return (promoSlug = have[0].slug);
    for (var i = 0; i < 4; i++) {
      var slug = (wanted || 'p') + Math.random().toString(36).slice(2, 6);
      var r = await cust.from('promoters').insert({ slug: slug, owner: custUid });
      if (!r.error) return (promoSlug = slug);
    }
    throw new Error('promo_slug');
  }
  // "Pronto en Pido y Ido": one request per person (anonymous customer account) per business
  async function voteBiz(slug) { await ensureCust(); return check(await cust.rpc('vote_pronto', { p_slug: slug })); }
  async function suggestBiz(x) { await ensureCust(); return check(await cust.rpc('suggest_biz', { p_slug: x.slug, p_name: x.name, p_kind: x.kind, p_town: x.town, p_note: x.note || '' })); }
  async function bizExtra() { await ensureCust(); return check(await cust.rpc('pronto_extra')) || []; }
  async function bizCounts() { await ensureCust(); return check(await cust.rpc('pronto_counts')) || []; }
  // Resumen del mes del negocio (supabase/010-resumen-mes.sql). ym = 'AAAA-MM'.
  async function restMonth(ym) { if (!restUid) throw new Error('no_rest'); return check(await rest.rpc('rest_resumen_mes', { p_mes: ym })); }
  async function promoOrders() { await ensureCust(); return check(await cust.rpc('promo_orders')); }

  // ---------- live updates ----------
  function live(onChange) {
    var t = null;
    var poke = function () { clearTimeout(t); t = setTimeout(onChange, 300); };
    [cust, rest].forEach(function (c, i) {
      try {
        c.channel('pyi-' + i)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, poke)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, poke)
          .subscribe();
      } catch (e) {}
    });
    // the restaurant client must use its own login for live updates
    rest.auth.onAuthStateChange(function (ev, s) { if (s && s.access_token) try { rest.realtime.setAuth(s.access_token); } catch (e) {} });
  }

  window.PYI_CLOUD = {
    fetchAll: fetchAll, placeOrder: placeOrder, orderContact: orderContact, markPaid: markPaid, cancelOrder: cancelOrder, rateOrder: rateOrder,
    deliver: deliver, orderForRider: orderForRider, riderPicked: riderPicked, confirmReceived: confirmReceived,
    restLogin: restLogin, restSignup: restSignup, createRest: createRest, restLogout: restLogout, updateRest: updateRest, updateOrder: updateOrder, payOk: payOk, notDelivered: notDelivered,
    addMyRider: addMyRider, uploadPhoto: uploadPhoto, uploadList: uploadList, listUrl: listUrl, priceOrder: priceOrder, linkRider: linkRider, unlinkRider: unlinkRider,
    saveProfile: saveProfile, deleteProfile: deleteProfile, ensurePromoter: ensurePromoter, promoOrders: promoOrders, restMonth: restMonth, voteBiz: voteBiz, bizCounts: bizCounts, suggestBiz: suggestBiz, bizExtra: bizExtra,
    live: live, restUid: function () { return restUid; }, myRest: function () { return myRest; }
  };
})();
