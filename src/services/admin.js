import { supabase } from '../lib/supabaseClient'

// =============================================
// Clave de administración (guardada en sessionStorage)
// =============================================
const KEY_STORAGE = 'salva_admin_key'

export const getAdminKey = () => {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export const setAdminKey = (key) => {
  try {
    sessionStorage.setItem(KEY_STORAGE, key)
  } catch {
    // sessionStorage no disponible: la clave solo vivirá en memoria
  }
}

export const clearAdminKey = () => {
  try {
    sessionStorage.removeItem(KEY_STORAGE)
  } catch {
    // ignorar
  }
}

// =============================================
// Helpers
// =============================================
const rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data
}

const rows = async (query) => {
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Traduce errores técnicos a mensajes accionables
export const friendlyError = (error) => {
  const msg = (error && error.message) || ''
  if (msg.includes('does not exist') || msg.includes('schema-cache')) {
    return 'Función no disponible. Aplica la migración 002_admin_panel.sql en Supabase.'
  }
  if (msg.includes('Clave de administrador')) {
    return 'Clave de administrador incorrecta.'
  }
  if (msg.includes('Clave debe') || msg.includes('clave debe')) {
    return 'La clave debe tener al menos 6 caracteres.'
  }
  if (
    msg.toLowerCase().includes('row-level security') ||
    msg.includes('permission denied')
  ) {
    return 'Sin permisos: aplica la migración 002_admin_panel.sql en Supabase.'
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'No se pudo conectar con Supabase. Revisa REACT_APP_SUPABASE_URL / ANON_KEY.'
  }
  return msg || 'Error inesperado. Intenta de nuevo.'
}

// =============================================
// Clave de administrador
// =============================================
export const verifyAdminKey = async (key) => {
  const ok = await rpc('admin_check_key', { p_key: key })
  if (ok) setAdminKey(key)
  return !!ok
}

// =============================================
// Dashboard
// =============================================
export const fetchDashboardStats = async () => {
  const [donationsRes, volunteersRes, alliancesRes] = await Promise.all([
    supabase
      .from('donations')
      .select('id, amount, currency, payment_status, donor_name, donor_email, type, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase.from('volunteers').select('id, status').limit(1000),
    supabase.from('corporate_alliances').select('id, status').limit(1000),
  ])

  if (donationsRes.error) throw donationsRes.error
  if (volunteersRes.error) throw volunteersRes.error
  if (alliancesRes.error) throw alliancesRes.error

  const donations = donationsRes.data || []
  const volunteers = volunteersRes.data || []
  const alliances = alliancesRes.data || []

  const approvedTotals = {}
  donations
    .filter((d) => d.payment_status === 'approved')
    .forEach((d) => {
      const currency = d.currency || 'COP'
      approvedTotals[currency] =
        (approvedTotals[currency] || 0) + Number(d.amount || 0)
    })

  return {
    totalDonations: donations.length,
    approvedDonations: donations.filter((d) => d.payment_status === 'approved').length,
    pendingDonations: donations.filter((d) => d.payment_status === 'pending').length,
    approvedTotals,
    totalVolunteers: volunteers.length,
    pendingVolunteers: volunteers.filter((v) => v.status === 'pending').length,
    totalAlliances: alliances.length,
    pendingAlliances: alliances.filter((a) => a.status === 'pending').length,
    recent: donations.slice(0, 5),
  }
}

// =============================================
// Donaciones
// =============================================
export const fetchDonations = async (status = 'all') => {
  let query = supabase
    .from('donations')
    .select('id, amount, currency, donor_name, donor_email, type, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (status && status !== 'all') {
    query = query.eq('payment_status', status)
  }

  return rows(query)
}

export const updateDonationStatus = (id, status, key) =>
  rpc('admin_update_donation_status', { p_id: id, p_status: status, p_key: key })

// =============================================
// Voluntarios
// =============================================
export const fetchVolunteers = async () =>
  rows(
    supabase
      .from('volunteers')
      .select('id, full_name, email, phone, availability, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500)
  )

export const updateVolunteerStatus = (id, status, key) =>
  rpc('admin_update_volunteer_status', { p_id: id, p_status: status, p_key: key })

// =============================================
// Alianzas corporativas
// =============================================
export const fetchAlliances = async () =>
  rows(
    supabase
      .from('corporate_alliances')
      .select('id, company_name, contact_name, contact_email, company_size, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500)
  )

export const updateAllianceStatus = (id, status, key) =>
  rpc('admin_update_alliance_status', { p_id: id, p_status: status, p_key: key })

// =============================================
// Transacciones (requiere clave: RLS no permite lectura a anon)
// =============================================
export const fetchTransactions = async (key) =>
  rpc('admin_get_transactions', { p_key: key })
