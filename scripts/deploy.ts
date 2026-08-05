/**
 * Pushes agent.ts to Retell. Creates the agent the first time, updates it
 * in place after that (Retell keeps the version history).
 *
 *   npm run agent:deploy
 */
import Retell from 'retell-sdk';
import { AGENT_NAME, VOICE_ID, MODEL, PROMPT } from '../agent';

const apiKey = process.env.RETELL_API_KEY;
if (!apiKey) {
  console.error('❌ RETELL_API_KEY is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const client = new Retell({ apiKey });

const existing = (await client.agent.list()).items?.find((a) => a.agent_name === AGENT_NAME);

// The list endpoint returns slim records, so fetch the full agent for its llm_id.
const full = existing ? await client.agent.retrieve(existing.agent_id) : undefined;
const llmId = full?.response_engine?.type === 'retell-llm' ? full.response_engine.llm_id : undefined;

const llm = llmId
  ? await client.llm.update(llmId, { model: MODEL, general_prompt: PROMPT })
  : await client.llm.create({ model: MODEL, general_prompt: PROMPT });

const params = {
  agent_name: AGENT_NAME,
  voice_id: VOICE_ID,
  language: 'en-US' as const,
  response_engine: { type: 'retell-llm' as const, llm_id: llm.llm_id },
};

const agent = existing
  ? await client.agent.update(existing.agent_id, params)
  : await client.agent.create(params);

console.log(`✅ ${existing ? 'Updated' : 'Created'} "${AGENT_NAME}"`);
console.log(`   agent_id: ${agent.agent_id}`);
console.log(`   llm_id:   ${llm.llm_id}`);
console.log(`   voice:    ${agent.voice_id}`);
console.log('\n   Test it: https://dashboard.retellai.com');
