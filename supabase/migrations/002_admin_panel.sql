-- =============================================
-- MIGRACIÓN 002: Panel de Administrador
--
-- Agrega:
--   1) Tabla planeta.admin_config (clave de acceso, hasheada)
--      -> Sin políticas RLS: inaccesible desde anon/authenticated.
--   2) Funciones SECURITY DEFINER para el panel:
--        - planeta.admin_set_key(clave)          -- fijar/cambiar clave
--        - planeta.admin_check_key(clave)        -- validar clave
--        - planeta.admin_get_transactions(clave) -- leer log de pagos
--        - planeta.admin_update_donation_status(id, estado, clave)
--        - planeta.admin_update_volunteer_status(id, estado, clave)
--        - planeta.admin_update_alliance_status(id, estado, clave)
--
-- El RLS actual solo permite SELECT (donations/volunteers/alliances)
-- y solo service_role puede leer payment_transactions o actualizar
-- estados. Estas funciones (SECURITY DEFINER, owner = postgres)
-- permiten que el panel opere verificando una clave compartida.
--
-- INSTALACIÓN:
--   1) Aplicar esta migración (supabase db push o SQL Editor).
--   2) Fijar la clave:  SELECT planeta.admin_set_key('TuClaveSegura');
--   3) La clave se ingresa en el panel de administración del sitio.
-- =============================================

-- pgcrypto para crypt()/gen_salt() (hash bcrypt de la clave)
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    EXECUTE 'CREATE EXTENSION pgcrypto WITH SCHEMA extensions';
  END IF;
END $$;

-- =============================================
-- TABLA: admin_config (clave del panel)
-- =============================================
CREATE TABLE IF NOT EXISTS planeta.admin_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  panel_key_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT admin_config_single_row CHECK (id)
);

-- RLS habilitado y SIN políticas -> solo service_role/postgres acceden.
ALTER TABLE planeta.admin_config ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCIÓN: admin_set_key
-- Fija o cambia la clave del panel (bcrypt).
-- =============================================
CREATE OR REPLACE FUNCTION planeta.admin_set_key(p_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, planeta, public
AS $$
BEGIN
  IF p_key IS NULL OR length(p_key) < 6 THEN
    RAISE EXCEPTION 'La clave debe tener al menos 6 caracteres';
  END IF;

  INSERT INTO planeta.admin_config (id, panel_key_hash, updated_at)
  VALUES (TRUE, crypt(p_key, gen_salt('bf', 10)), NOW())
  ON CONFLICT (id) DO UPDATE
    SET panel_key_hash = EXCLUDED.panel_key_hash,
        updated_at = NOW();
END;
$$;

-- =============================================
-- FUNCIÓN: admin_check_key
-- =============================================
CREATE OR REPLACE FUNCTION planeta.admin_check_key(p_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, planeta, public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT panel_key_hash INTO v_hash
  FROM planeta.admin_config
  WHERE id = TRUE;

  IF v_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN crypt(p_key, v_hash) = v_hash;
END;
$$;

-- =============================================
-- FUNCIÓN: admin_update_donation_status
-- =============================================
CREATE OR REPLACE FUNCTION planeta.admin_update_donation_status(
  p_id UUID,
  p_status TEXT,
  p_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, planeta, public
AS $$
BEGIN
  IF NOT planeta.admin_check_key(p_key) THEN
    RAISE EXCEPTION 'Clave de administrador incorrecta';
  END IF;

  IF p_status NOT IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled') THEN
    RAISE EXCEPTION 'Estado de donación no válido';
  END IF;

  UPDATE planeta.donations
  SET payment_status = p_status
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donación no encontrada';
  END IF;
END;
$$;

-- =============================================
-- FUNCIÓN: admin_update_volunteer_status
-- =============================================
CREATE OR REPLACE FUNCTION planeta.admin_update_volunteer_status(
  p_id UUID,
  p_status TEXT,
  p_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, planeta, public
AS $$
BEGIN
  IF NOT planeta.admin_check_key(p_key) THEN
    RAISE EXCEPTION 'Clave de administrador incorrecta';
  END IF;

  IF p_status NOT IN ('pending', 'active', 'inactive') THEN
    RAISE EXCEPTION 'Estado de voluntario no válido';
  END IF;

  UPDATE planeta.volunteers
  SET status = p_status
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voluntario no encontrado';
  END IF;
END;
$$;

-- =============================================
-- FUNCIÓN: admin_update_alliance_status
-- =============================================
CREATE OR REPLACE FUNCTION planeta.admin_update_alliance_status(
  p_id UUID,
  p_status TEXT,
  p_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, planeta, public
AS $$
BEGIN
  IF NOT planeta.admin_check_key(p_key) THEN
    RAISE EXCEPTION 'Clave de administrador incorrecta';
  END IF;

  IF p_status NOT IN ('pending', 'active', 'expired', 'rejected') THEN
    RAISE EXCEPTION 'Estado de alianza no válido';
  END IF;

  UPDATE planeta.corporate_alliances
  SET status = p_status
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alianza no encontrada';
  END IF;
END;
$$;

-- =============================================
-- FUNCIÓN: admin_get_transactions
-- Lectura del log de pagos de Mercado Pago
-- (payment_transactions es solo visible para service_role vía RLS).
-- =============================================
CREATE OR REPLACE FUNCTION planeta.admin_get_transactions(p_key TEXT)
RETURNS TABLE (
  id UUID,
  donation_id UUID,
  mp_payment_id TEXT,
  amount NUMERIC,
  currency TEXT,
  status TEXT,
  webhook_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, planeta, public
AS $$
BEGIN
  IF NOT planeta.admin_check_key(p_key) THEN
    RAISE EXCEPTION 'Clave de administrador incorrecta';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.donation_id,
    t.mp_payment_id,
    t.amount,
    t.currency,
    t.status,
    t.webhook_received_at,
    t.created_at
  FROM planeta.payment_transactions t
  ORDER BY t.created_at DESC
  LIMIT 500;
END;
$$;

-- PostgREST ejecuta las funciones con el rol que hace la petición;
-- el acceso se controla con la clave (no con EXECUTE).
GRANT USAGE ON SCHEMA planeta TO anon, authenticated;
GRANT EXECUTE ON FUNCTION planeta.admin_set_key(TEXT) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION planeta.admin_check_key(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION planeta.admin_update_donation_status(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION planeta.admin_update_volunteer_status(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION planeta.admin_update_alliance_status(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION planeta.admin_get_transactions(TEXT) TO anon, authenticated;
