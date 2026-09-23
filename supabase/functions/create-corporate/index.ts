import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_name, contact_name, contact_email, employees, message } = await req.json()

    if (!company_name || !contact_email) {
      return new Response(
        JSON.stringify({ error: 'Empresa y email son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { db: { schema: 'planeta' } }
    )

    const { data, error } = await supabase
      .from('corporate_alliances')
      .insert({
        company_name,
        contact_name: contact_name || '',
        contact_email,
        company_size: employees || 0,
        message: message || '',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ alliance: data, message: 'Alianza corporativa registrada exitosamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
