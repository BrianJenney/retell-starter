# Retell Voice Agent Starter

A Next.js API that places an AI phone call. POST a name, a reason, and a date/time —
the agent calls the person and confirms the appointment.

## Setup

1. `npm install`
2. `cp .env.example .env.local` and fill it in:
   - `RETELL_API_KEY` — https://dashboard.retellai.com → API Keys
   - `RETELL_FROM_NUMBER` — buy a number in the Retell dashboard (Phone Numbers → Buy)
   - `CALL_TO_NUMBER` — optional default number to dial
3. Write your prompt in **`agent.ts`** — that's the only file you need to edit.
4. `npm run agent:deploy` — pushes the prompt to Retell.
5. `npm run dev`, then:

```bash
curl -X POST localhost:3000/api/call \
  -H 'content-type: application/json' \
  -d '{"name":"Brian","reason":"a teeth cleaning","datetime":"Thursday at 2:30pm"}'
```

Your phone rings. That's it.

## The endpoint

`POST /api/call`

| field      | required | notes                                            |
|------------|----------|--------------------------------------------------|
| `name`     | yes      | who the agent is calling                          |
| `reason`   | yes      | reason for the visit                              |
| `datetime` | no       | appointment time; defaults to now                 |
| `phone`    | no       | E.164 (`+15551234567`); defaults to `CALL_TO_NUMBER` |

Returns `{ "call_id": "..." }`. Those three fields land in the prompt as
`{{name}}`, `{{reason}}` and `{{datetime}}`.

## Files

```
agent.ts            ← your prompt, voice, model  (edit this)
call.ts             ← validation + the Retell call
app/api/call/route.ts
scripts/deploy.ts   ← npm run agent:deploy
call.test.ts        ← npm test
```

## Deploying the API

```bash
npx vercel
```
Add `RETELL_API_KEY` and `RETELL_FROM_NUMBER` in the Vercel project's env vars,
then `npx vercel --prod`.

Re-run `npm run agent:deploy` any time you change the prompt. It updates the
agent in place, so Retell keeps the version history.
