import Retell from 'retell-sdk';
import { z } from 'zod';

/** ← Your phone. This is a demo, so every call goes here. */
const TO_NUMBER = '+19252376216';

const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });

const Body = z.object({
	name: z.string().min(1),
	reason: z.string().min(1),
	datetime: z.string().default(() => new Date().toLocaleString('en-US')),
});

/**
 * POST /api/call
 * { "name": "Brian", "reason": "a cleaning", "datetime": "Thursday at 2:30pm" }
 */
export async function POST(req: Request) {
	const { name, reason, datetime } = Body.parse(await req.json());

	const call = await retell.call.createPhoneCall({
		from_number: process.env.RETELL_FROM_NUMBER!,
		to_number: TO_NUMBER,
		override_agent_id: process.env.RETELL_AGENT_ID,
		retell_llm_dynamic_variables: {
			name: name,
			reason: reason,
			datetime: datetime,
		},
	});

	return Response.json({ call_id: call.call_id });
}

/** GET /api/call?id=call_abc — the structured data, once the call has ended. */
export async function GET(req: Request) {
	const id = new URL(req.url).searchParams.get('id');
	if (!id)
		return Response.json({ error: 'pass ?id=<call_id>' }, { status: 400 });

	const call = await retell.call.retrieve(id);
	return Response.json({
		status: call.call_status,
		analysis: call.call_analysis?.custom_analysis_data,
	});
}
