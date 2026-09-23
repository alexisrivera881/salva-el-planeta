import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, availability } = await req.json()

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Nombre y email son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { db: { schema: 'planeta' } }
    )

    const { data, error } = await supabase
      .from('volunteers')
      .insert({
        full_name: name,
        email: email,
        phone: phone || '',
        availability: availability || 'both',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ volunteer: data, message: 'Voluntario registrado exitosamente' }),
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
