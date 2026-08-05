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

  /**
   * Latency is what makes a call feel human, so start small and only go
   * bigger if the agent is making mistakes.
   *   fast + cheap : gpt-4.1-mini, gpt-4.1-nano, gpt-5-mini, gemini-3.5-flash
   *   smarter      : gpt-4.1, gpt-5, gpt-5.5, claude-4.6-sonnet
   *   lowest lag   : gpt-realtime-mini, gpt-realtime-2  (speech-to-speech)
   */
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
   - Yes → tell them to arrive 10 minutes early.
   - No  → say someone will call back to reschedule.
4. Thank them, say goodbye, then use the end_call tool to hang up.

## Rules
- Do not invent details you weren't given.
- If you reach voicemail, leave a 10-second version of the confirmation and
  immediately use the end_call tool.
- Never keep the line open after saying goodbye. Always hang up yourself.
`,

  /**
   * Tools the agent can use mid-call.
   *
   * end_call is Retell's built-in hang-up. Without it the agent physically
   * cannot end a call — it just waits until the caller hangs up or the
   * silence timeout fires. Keep it.
   *
   * To add your own, build an endpoint and describe it here:
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
  tools: [
    {
      type: 'end_call',
      name: 'end_call',
      description: 'Hang up. Use this once you have said goodbye, or after leaving a voicemail.',
    },
  ],

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

  /** Optional. The defaults are fine — tune these when a call feels off. */
  settings: {
    /** 0–1. Higher = replies faster with less thinking pause. Lower = more deliberate. */
    responsiveness: 1,

    /** 0–1. Higher = the agent shuts up faster when the caller talks over it. */
    interruption_sensitivity: 1,

    /** "mm-hm", "right" while the caller is talking. Human, but grating if overdone. */
    enable_backchannel: true,
    backchannel_frequency: 0.8, // 0–1

    /**
     * Room tone behind the agent. Dead silence sounds synthetic.
     * null | 'call-center' | 'coffee-shop' | 'convention-hall'
     * | 'summer-outdoor' | 'mountain-outdoor' | 'static-noise'
     */
    ambient_sound: 'call-center',
    ambient_sound_volume: 1, // 0–2

    /** Hard stop, so a stuck call can't bill forever. 2 minutes. */
    max_call_duration_ms: 120_000,

    /** Hang up after this much dead air — catches voicemail and dropped calls. */
    end_call_after_silence_ms: 10_000,
  },
};
