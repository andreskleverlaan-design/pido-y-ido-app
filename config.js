/* Pido y Ido: conexión con la base de datos en línea.
   Vacío = modo demo (los datos quedan solo en cada celular).
   Con los dos datos de Supabase = modo en línea (los pedidos llegan de un celular a otro).
   Esta clave es pública a propósito (publishable). Nunca pongas aquí la clave secreta. */
window.PYI_CONFIG = {
  supabaseUrl: 'https://wzhedbeefiudwafxrynh.supabase.co',
  supabaseKey: 'sb_publishable_Y6Ua8mn7l0CPxAFsIN9G4A_eeX3dpbs',
  // Poner en true cuando los avisos de WhatsApp desde el número de Pido y Ido estén listos (supabase/functions/avisos-whatsapp).
  whatsappAvisos: false,
  // Número de Nequi de Pido y Ido donde los negocios pagan sus promociones (solo números, ej. '3001234567'). Vacío = les escribimos por WhatsApp.
  pagoNequi: ''
};
