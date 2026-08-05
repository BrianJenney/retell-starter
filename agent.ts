/**
 * ─────────────────────────────────────────────────────────────
 *  THIS IS THE ONLY FILE YOU NEED TO EDIT.
 * ─────────────────────────────────────────────────────────────
 *
 * Edit the prompt, then: npm run agent:deploy
 */

export const AGENT = {
  name: 'Front Desk',

  /** Voice list: https://dashboard.retellai.com → Voices */
  voice_id: '11labs-Adrian',

  /** gpt-4.1-mini is fast, and latency is what makes a call feel human. */
  model: 'gpt-4.1-mini',

  /**
   * {{name}}, {{reason}} and {{datetime}} come from the POST body at call time.
   */
  prompt: `
## Identity
You are Riley, the front desk assistant for Northside Dental. You are calling
{{name}} to confirm their upcoming appointment.

## Context
- Who you're calling: {{name}}
- Reason for the visit: {{reason}}
- Appointment date and time: {{datetime}}

## Style
Warm, quick, human. Short sentences. This is a phone call, not an essay —
one or two sentences per turn. Never read a list out loud.

## Task
1. Greet them by first name and say who you are.
2. Confirm the appointment: read back the reason and the date/time.
3. Ask if that still works for them.
   - Yes → tell them to arrive 10 minutes early, then wrap up.
   - No  → say someone will call back to reschedule, then wrap up.
4. Thank them and end the call.

## Rules
- Do not invent details you weren't given.
- If you reach voicemail, leave a 10-second version of the confirmation and hang up.
- Keep the whole call under two minutes.
`,

  /**
   * Structured data Retell extracts after the call ends.
   * Read it back with: GET /api/call?id=<call_id>
   */
  analysis: [
    {
      type: 'string',
      name: 'sentiment',
      description: 'How the person sounded. One of: "positive", "neutral", "negative".',
    },
    {
      type: 'string',
      name: 'summary',
      description: 'What happened on the call, in one or two sentences.',
    },
    {
      type: 'boolean',
      name: 'confirmed',
      description: 'True only if they confirmed the appointment time works.',
    },
  ],

  /**
   * Tools the agent can call mid-conversation. Empty is fine — deploy works
   * without any. To add one, build an endpoint and describe it here:
   *
   * {
   *   type: 'custom',
   *   name: 'check_availability',
   *   description: 'Look up open appointment slots. Call this when the caller asks to reschedule.',
   *   url: 'https://your-app.vercel.app/api/tools/availability',
   *   parameters: {
   *     type: 'object',
   *     properties: { day: { type: 'string', description: 'Day to check, e.g. "Thursday"' } },
   *     required: ['day'],
   *   },
   * }
   */
  tools: [],
};
