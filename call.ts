import Retell from 'retell-sdk';
import { AGENT_NAME } from './agent';

export type CallArgs = {
  to: string;
  name: string;
  reason: string;
  datetime: string;
};

type Parsed = { ok: true; call: CallArgs } | { ok: false; error: string };

/** Pure — no network, no env reads. Everything it needs is passed in. */
export function parseCallRequest(body: unknown, defaultTo: string | undefined, now: Date): Parsed {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const name = str(b.name);
  const reason = str(b.reason);
  const to = str(b.phone) || str(defaultTo);
  const datetime = str(b.datetime) || now.toLocaleString('en-US');

  if (!name) return { ok: false, error: 'name is required' };
  if (!reason) return { ok: false, error: 'reason is required' };
  if (!to) return { ok: false, error: 'phone is required (or set CALL_TO_NUMBER)' };
  if (!/^\+\d{8,15}$/.test(to)) return { ok: false, error: `phone must be E.164, e.g. +15551234567 (got "${to}")` };

  return { ok: true, call: { to, name, reason, datetime } };
}

// Resolving the agent by name costs an API call, so do it once per process.
let agentId: string | undefined;

/** Places a real phone call. Returns the Retell call_id. */
export async function placeCall(args: CallArgs): Promise<string> {
  const apiKey = process.env.RETELL_API_KEY;
  const from = process.env.RETELL_FROM_NUMBER;
  if (!apiKey) throw new Error('RETELL_API_KEY is not set');
  if (!from) throw new Error('RETELL_FROM_NUMBER is not set (buy a number in the Retell dashboard)');

  const client = new Retell({ apiKey });

  if (!agentId) {
    const agent = (await client.agent.list()).items?.find((a) => a.agent_name === AGENT_NAME);
    if (!agent) throw new Error(`Agent "${AGENT_NAME}" not found. Run: npm run agent:deploy`);
    agentId = agent.agent_id;
  }

  const call = await client.call.createPhoneCall({
    from_number: from,
    to_number: args.to,
    override_agent_id: agentId,
    retell_llm_dynamic_variables: {
      name: args.name,
      reason: args.reason,
      datetime: args.datetime,
    },
  });

  return call.call_id;
}
