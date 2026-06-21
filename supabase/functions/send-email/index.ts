// Supabase Edge Function: send-email
// Calls the Resend API to deliver transactional emails.
//
// Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY  — your key from resend.com
//   APP_URL         — https://dev-crew-flame.vercel.app
//
// Request body (JSON):
//   { to_email: string, subject: string, body: string }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'DevCrew <notifications@dev-crew-flame.vercel.app>'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://dev-crew-flame.vercel.app'

    if (!RESEND_API_KEY) {
      console.warn('[send-email] RESEND_API_KEY is not set — skipping email delivery.')
      return new Response(
        JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { to_email, subject, body } = await req.json()

    if (!to_email || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing to_email, subject, or body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const emailBody = `${body}\n\n---\nOpen DevCrew: ${APP_URL}`

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to_email],
        subject,
        text: emailBody,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[send-email] Resend error:', result)
      return new Response(JSON.stringify({ error: result }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('[send-email] Sent to', to_email, '| id:', result.id)
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[send-email] Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
