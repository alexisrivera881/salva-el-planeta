import { supabase } from '../lib/supabaseClient'

export const createDonation = async ({ amount, currency = 'COP', name, email, type = 'donation' }) => {
  const { data, error } = await supabase.functions.invoke('create-donation', {
    body: {
      amount,
      currency,
      name,
      email,
      type
    }
  })

  if (error) throw error
  return data
}

export const createVolunteer = async ({ name, email, phone, availability }) => {
  const { data, error } = await supabase.functions.invoke('create-volunteer', {
    body: {
      name,
      email,
      phone,
      availability
    }
  })

  if (error) throw error
  return data
}

export const createCorporateAlliance = async ({ company, contact, email, employees, message }) => {
  const { data, error } = await supabase.functions.invoke('create-corporate', {
    body: {
      company_name: company,
      contact_name: contact,
      contact_email: email,
      employees: parseInt(employees) || 0,
      message
    }
  })

  if (error) throw error
  return data
}

export const getDonationHistory = async (email) => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_email', email)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
