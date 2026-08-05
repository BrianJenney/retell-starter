---
name: voice-agent
description: Build, deploy, and debug Retell voice AI agents in this repo. Covers prompt structure for phone calls, the deploy loop, dynamic variables, custom tools, post-call structured output, and the gotchas that waste an afternoon. Use when the user says "change the agent", "the agent won't hang up", "add a tool", "why did the call fail", "tune the voice", "deploy the agent", or is writing/editing a Retell prompt.
---

# Building Retell Voice Agents

## The loop

```
edit agent.ts  →  npm run agent:deploy  →  POST /api/call  →  GET /api/call?id=…
```

`agent.ts` is the single source of truth. `deploy.ts` upserts by `AGENT.name`,
so re-running it updates in place and Retell keeps version history. Nothing is
ever deleted.

Everything except the prompt lives in one exported `AGENT` object: `model`,
`voice_id`, `tools`, `analysis`, `settings`.

## Gotchas that cost real time

**No `end_call` tool means the agent cannot hang up.** It will talk, say
goodbye, and then sit on an open line until the caller leaves or
`end_call_after_silence_ms` fires. Symptom: `disconnection_reason:
"user_hangup"` and a call 5–10× longer than it should be. Keep the built-in
`end_call` tool in `AGENT.tools` and tell the prompt to use it after goodbye
*and* after leaving voicemail.

**`call_status` stays `"ongoing"` for the entire call**, not just while
dialing. It is not a health check. A call that is 90 seconds into a real
conversation looks identical to one that never connected. The honest signal is
`disconnection_reason`, which only exists once status flips to `"ended"`.
Don't diagnose a "failed" call before then.

**`call_analysis` lands ~30s after hangup**, not at hangup. A `GET` right after
the call ends returns `analysis: undefined`. That's normal — poll or wait.

**Dynamic variable names must match exactly.** `{{name}}` in the prompt is fed
by `retell_llm_dynamic_variables: { name }`. A typo doesn't error — the agent
just says the literal string `{{nmae}}` out loud on the phone.

**Local numbers beat toll-free for outbound.** Toll-free gets filtered by more
carriers. Buy a local area code for demos.

## Writing prompts for phone calls

Phone prompts are not chat prompts. What works:

```
## Identity      — who the agent is, one or two lines
## Context       — the {{variables}} it was handed
## Style         — "one or two sentences per turn", "never read a list out loud"
## Task          — numbered steps, with explicit branches
## Rules         — what never to do; how to hang up; what to do on voicemail
```

Rules that earn their place every time:
- "Do not invent details you weren't given." (stops hallucinated addresses/prices)
- "If you reach voicemail, leave a 10-second version and use end_call."
- "Keep the whole call under two minutes."

Long prompts raise latency and latency is what makes an agent feel synthetic.
Cut before you add.

## Structured output

`AGENT.analysis` defines what Retell extracts after the call. Types are
`string`, `boolean`, `number`. There's no enum type — put the allowed values in
the description and the model complies:

```ts
{ type: 'string', name: 'sentiment',
  description: 'How the person sounded. One of: "positive", "neutral", "negative".' }
```

Booleans need a bias or you get optimistic garbage: "True **only if** they
confirmed the appointment time works."

Keep it to a handful of fields. Every field is another thing to extract and
another thing to get wrong.

## Adding a tool

Tools let the agent act mid-call. Build an endpoint that takes JSON and returns
JSON, then describe it in `AGENT.tools`:

```ts
{
  type: 'custom',
  name: 'check_availability',
  description: 'Look up open slots. Call this when the caller asks to reschedule.',
  url: 'https://your-app.vercel.app/api/tools/availability',
  parameters: {
    type: 'object',
    properties: { day: { type: 'string', description: 'Day to check, e.g. "Thursday"' } },
    required: ['day'],
  },
}
```

The `description` is the only thing deciding *when* it fires — write it as an
instruction, not a label. The endpoint must be publicly reachable; localhost
will not work from a live call (tunnel it or deploy first).

## Tuning

`AGENT.settings` — the knobs worth touching, in order of impact:

| setting | effect |
|---|---|
| `model` | biggest latency lever. `gpt-4.1-mini` is the sane default; realtime models are lowest lag |
| `responsiveness` | 0–1. how fast it jumps in. Lower feels thoughtful, higher feels eager |
| `interruption_sensitivity` | 0–1. how fast it stops when talked over |
| `ambient_sound` | dead silence sounds synthetic; `call-center` reads as a real office |
| `end_call_after_silence_ms` | your safety net for voicemail and dropped calls |
| `max_call_duration_ms` | hard cost ceiling on a stuck call |

Change one at a time and place a real call. These interact.

## Debugging a call

```bash
node --env-file=.env.local --input-type=module -e "
import Retell from 'retell-sdk';
const c = new Retell({apiKey: process.env.RETELL_API_KEY});
const x = await c.call.retrieve('call_…');
console.log(x.call_status, x.disconnection_reason, x.transcript);
"
```

Reading `disconnection_reason`:
- `agent_hangup` — worked, agent ended it
- `user_hangup` — they hung up; if the call was long, the agent couldn't end it
- `dial_no_answer` / `voicemail_reached` — never reached a human
- `dial_failed` — number or from-number problem, not a prompt problem

Swap `call.retrieve` for `call.list({limit: 20, sort_order: 'descending'})` to
compare against calls that did work — that's the fastest way to tell a bad
prompt from a bad phone number.

## Before shipping

- `POST /api/call` has no auth. Anyone who finds the URL dials out on your
  account. Add a shared secret or Vercel protection before it goes public.
- Only dial numbers you have permission to call.
