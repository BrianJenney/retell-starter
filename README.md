# Retell Voice Agent Starter

A Next.js API that places an AI phone call. POST a name, a reason and a date/time —
the agent calls, confirms the appointment, and hands back a structured summary.

## Setup

1. `npm install`
2. `cp .env.example .env.local` and add your `RETELL_API_KEY`
   (https://dashboard.retellai.com → API Keys) and `RETELL_FROM_NUMBER`
   (Phone Numbers → Buy a local number).
3. Write your prompt in **`agent.ts`** — that's the only file you edit.
4. `npm run agent:deploy` — pushes the prompt to Retell and prints an
   `RETELL_AGENT_ID`. Paste that into `.env.local`.
5. Set `TO_NUMBER` in `app/api/call/route.ts` to your own phone.
6. `npm run dev`, then:

```bash
curl -X POST localhost:3000/api/call \
  -H 'content-type: application/json' \
  -d '{"name":"Brian","reason":"a teeth cleaning","datetime":"Thursday at 2:30pm"}'
# → {"call_id":"call_71fc..."}
```

Your phone rings.

## Reading the result

After the call ends, Retell extracts the fields defined in `AGENT.analysis`:

```bash
curl "localhost:3000/api/call?id=call_71fc..."
# → {"status":"ended","analysis":{
#      "sentiment":"neutral",
#      "needs_rescheduling":false,
#      "summary":"The agent confirmed Brian's appointment and he agreed to arrive early."}}
```

Analysis takes ~30s after hangup. Note that `status` stays `"ongoing"` for the
whole call, not just while it's dialing.

## The endpoint

`POST /api/call`

| field      | required | notes                             |
|------------|----------|-----------------------------------|
| `name`     | yes      | who the agent is calling          |
| `reason`   | yes      | reason for the visit              |
| `datetime` | no       | appointment time; defaults to now |

All three land in the prompt as `{{name}}`, `{{reason}}`, `{{datetime}}`.

## Files

```
agent.ts                 ← prompt, voice, model, tools, analysis, settings  (edit this)
app/api/call/route.ts    ← POST places the call, GET reads the analysis
scripts/deploy.ts        ← npm run agent:deploy
.claude/skills/          ← /voice-agent skill for Claude Code
```

## Using Claude Code with this repo

`.claude/skills/voice-agent` ships with the repo. Ask Claude Code to change the
prompt, add a tool, or explain why a call failed and it will pull in the
conventions and gotchas automatically.

## Tuning

`AGENT.settings` in `agent.ts` holds the optional knobs, each with a comment:
response latency, interruption sensitivity, backchannel ("mm-hm"), background
room tone, max call duration, and the silence timeout. The `model` comment
lists the fast/smart/realtime options.

## Extending

`AGENT.tools` carries Retell's built-in `end_call` — **keep it**. Without it the
agent has no way to hang up and the call runs until the caller leaves or the
silence timeout fires.

To let the agent do something mid-call — look up availability, take a message —
build an endpoint and describe it in that array. There's a commented example in
`agent.ts`.

## Deploying

```bash
npx vercel
```
Add `RETELL_API_KEY`, `RETELL_FROM_NUMBER` and `RETELL_AGENT_ID` to the Vercel
project's env vars, then `npx vercel --prod`.

Re-run `npm run agent:deploy` whenever you change the prompt. It updates the
agent in place, so Retell keeps the version history.
