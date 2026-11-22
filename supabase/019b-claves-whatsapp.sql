-- Pido y Ido 019b: guardar las dos claves de WhatsApp (Meta) en la caja fuerte de Supabase (Vault).
-- NO subas este archivo con las claves puestas. Cópialo, cambia los dos textos y pégalo en Supabase > SQL Editor > Run.
-- Se puede correr otra vez para cambiar una clave (por ejemplo cuando creas un token nuevo).
do $$
declare
  v_token text := 'PEGA-AQUI-EL-TOKEN-PERMANENTE';  -- Meta: Usuario del sistema > Generar token (empieza con EAA...)
  v_pid   text := 'PEGA-AQUI-EL-ID-DEL-NUMERO';     -- Meta: WhatsApp > Configuración de la API > Identificador del número de teléfono
  v_id uuid;
begin
  if v_token like 'PEGA-AQUI%' or v_pid like 'PEGA-AQUI%' then raise exception 'Primero cambia los dos textos PEGA-AQUI.'; end if;
  select id into v_id from vault.secrets where name = 'whatsapp_token';
  if v_id is null then perform vault.create_secret(v_token, 'whatsapp_token'); else perform vault.update_secret(v_id, v_token); end if;
  v_id := null;
  select id into v_id from vault.secrets where name = 'whatsapp_phone_id';
  if v_id is null then perform vault.create_secret(v_pid, 'whatsapp_phone_id'); else perform vault.update_secret(v_id, v_pid); end if;
end $$;
