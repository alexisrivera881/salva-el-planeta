import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    if (body.type !== 'payment') {
      return new Response('OK', { status: 200 })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return new Response('No payment ID', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { db: { schema: 'planeta' } }
    )

    const { data: existing } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('mp_payment_id', paymentId.toString())
      .single()

    if (existing) {
      return new Response('Already processed', { status: 200 })
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { 'Authorization': `Bearer ${mpAccessToken}` } }
    )

    const paymentData = await mpResponse.json()

    await supabase.from('payment_transactions').insert({
      mp_payment_id: paymentId.toString(),
      amount: paymentData.transaction_amount,
      currency: paymentData.currency_id,
      status: paymentData.status,
      mp_response: paymentData,
      webhook_received_at: new Date().toISOString()
    })

    if (paymentData.status === 'approved') {
      const donationId = paymentData.external_reference

      await supabase
        .from('donations')
        .update({
          mp_payment_id: paymentId.toString(),
          payment_status: 'approved',
          payment_method: paymentData.payment_method_id,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', donationId)
    } else if (paymentData.status === 'rejected') {
      await supabase
        .from('donations')
        .update({ payment_status: 'rejected' })
        .eq('mp_payment_id', paymentId.toString())
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
})
