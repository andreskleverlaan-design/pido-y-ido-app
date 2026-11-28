/* Pido y Ido: conexión con la base de datos en línea.
   Vacío = modo demo (los datos quedan solo en cada celular).
   Con los dos datos de Supabase = modo en línea (los pedidos llegan de un celular a otro).
   Esta clave es pública a propósito (publishable). Nunca pongas aquí la clave secreta. */
window.PYI_CONFIG = {
  supabaseUrl: 'https://wzhedbeefiudwafxrynh.supabase.co',
  supabaseKey: 'sb_publishable_Y6Ua8mn7l0CPxAFsIN9G4A_eeX3dpbs',
  // Poner en true cuando los avisos de WhatsApp desde el número de Pido y Ido estén listos (supabase/functions/avisos-whatsapp).
  whatsappAvisos: false,
  // Poner en true cuando el código por WhatsApp funcione (019-cuenta-whatsapp.sql + plantilla pyi_codigo en Meta).
  // Entonces el cliente confirma su número una vez y sus sellos y pedidos quedan guardados en su número.
  loginWhatsapp: false,
  // WhatsApp de Pido y Ido para ayuda (clave olvidada, negocios nuevos). 10 números, ej. '3101234567'.
  soporteWhatsapp: '3006358524',
  // Cómo le pagan los negocios sus facturas a Pido y Ido (pestaña Facturación). Solo salen los que tienen datos.
  // Ej.: nequi: '3001234567', banco: 'Bancolombia', tipoCuenta: 'ahorros', cuenta: '123-456789-00', titular: 'Nombre Apellido', documento: 'C.C. 123', llaveBreB: '@pidoyido'
  pago: { nequi: '', banco: '', tipoCuenta: 'ahorros', cuenta: '', titular: '', documento: '', llaveBreB: '' },
  // Quién responde por los datos (Ley 1581). Sale en "Tus datos y privacidad" y en "Términos".
  legal: { responsable: 'Pido y Ido', documento: 'C.C. 1125718059', correo: 'ayuda@pidoyido.co', direccion: '' }
};
