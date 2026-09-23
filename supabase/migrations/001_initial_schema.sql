-- =============================================
-- SCHEMA: planeta
-- =============================================
CREATE SCHEMA IF NOT EXISTS planeta;

-- =============================================
-- TABLA: donations (Donaciones)
-- =============================================
CREATE TABLE IF NOT EXISTS planeta.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ARS' CHECK (currency IN ('ARS', 'BRL', 'MXN', 'COP', 'USD')),
  donor_name TEXT DEFAULT 'Anónimo',
  donor_email TEXT DEFAULT '',
  type TEXT DEFAULT 'donation' CHECK (type IN ('donation', 'volunteer', 'corporate')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  payment_method TEXT,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  dedication TEXT,
  donated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: volunteers (Voluntarios)
-- =============================================
CREATE TABLE IF NOT EXISTS planeta.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  availability TEXT DEFAULT 'both' CHECK (availability IN ('weekdays', 'weekends', 'both', 'flexible')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: corporate_alliances (Alianzas Corporativas)
-- =============================================
CREATE TABLE IF NOT EXISTS planeta.corporate_alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_size INTEGER DEFAULT 0,
  contact_name TEXT DEFAULT '',
  contact_email TEXT NOT NULL,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: payment_transactions (Log de transacciones)
-- =============================================
CREATE TABLE IF NOT EXISTS planeta.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES planeta.donations(id) ON DELETE SET NULL,
  mp_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  mp_response JSONB,
  webhook_received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_donations_email ON planeta.donations(donor_email);
CREATE INDEX IF NOT EXISTS idx_donations_status ON planeta.donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_created ON planeta.donations(created_at);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON planeta.volunteers(email);
CREATE INDEX IF NOT EXISTS idx_corporate_email ON planeta.corporate_alliances(contact_email);
CREATE INDEX IF NOT EXISTS idx_payment_mp_id ON planeta.payment_transactions(mp_payment_id);

-- =============================================
-- HABILITAR Row Level Security (RLS)
-- =============================================
ALTER TABLE planeta.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE planeta.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE planeta.corporate_alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE planeta.payment_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS (permisos de acceso)
-- =============================================
CREATE POLICY "Service role can insert donations" ON planeta.donations
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update donations" ON planeta.donations
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "Anyone can read own donations" ON planeta.donations
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert volunteers" ON planeta.volunteers
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Anyone can read volunteers" ON planeta.volunteers
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert alliances" ON planeta.corporate_alliances
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Anyone can read alliances" ON planeta.corporate_alliances
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert transactions" ON planeta.payment_transactions
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can read transactions" ON planeta.payment_transactions
  FOR SELECT TO service_role USING (true);
