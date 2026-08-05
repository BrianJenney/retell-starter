import { parseCallRequest, placeCall } from '@/call';

/**
 * POST /api/call
 * { "name": "Brian", "reason": "cleaning", "datetime": "Tuesday at 3pm", "phone": "+15551234567" }
 *
 * `phone` falls back to CALL_TO_NUMBER, `datetime` falls back to now.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = parseCallRequest(body, process.env.CALL_TO_NUMBER, new Date());

  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const callId = await placeCall(parsed.call);
    return Response.json({ call_id: callId, calling: parsed.call.to });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'call failed';
    console.error('[api/call]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
