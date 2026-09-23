import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, name, email, type } = await req.json()

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Monto inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { db: { schema: 'planeta' } }
    )

    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        amount: parseFloat(amount),
        currency: currency || 'ARS',
        donor_name: name || 'Anónimo',
        donor_email: email || '',
        type: type || 'donation',
        payment_status: 'pending'
      })
      .select()
      .single()

    if (donationError) throw donationError

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')

    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({
          donation_id: donation.id,
          message: 'Donación registrada. Mercado Pago no configurado.',
          init_point: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`

    const preference = {
      items: [{
        id: donation.id,
        title: `Donación Salva el Planeta - ${type}`,
        unit_price: parseFloat(amount),
        quantity: 1,
        currency_id: currency || 'ARS'
      }],
      external_reference: donation.id,
      back_urls: {
        success: `${req.headers.get('origin') || 'http://localhost:3000'}/donacion/exito`,
        failure: `${req.headers.get('origin') || 'http://localhost:3000'}/donacion/fallo`,
        pending: `${req.headers.get('origin') || 'http://localhost:3000'}/donacion/pendiente`
      },
      auto_return: 'approved',
      notification_url: webhookUrl,
      metadata: {
        donation_id: donation.id
      }
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        reddeban: 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    })

    const preferenceData = await mpResponse.json()

    await supabase
      .from('donations')
      .update({ mp_preference_id: preferenceData.id })
      .eq('id', donation.id)

    return new Response(
      JSON.stringify({
        init_point: preferenceData.init_point,
        donation_id: donation.id
      }),
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
