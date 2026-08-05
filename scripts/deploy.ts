/**
 * Pushes agent.ts to Retell, then prints the agent id for your .env.local.
 * Re-run it any time you change the prompt — it updates in place.
 *
 *   npm run agent:deploy
 */
import Retell from 'retell-sdk';
import { AGENT } from '../agent';

if (!process.env.RETELL_API_KEY) {
  console.error('❌ RETELL_API_KEY is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const client = new Retell({ apiKey: process.env.RETELL_API_KEY });

const existing = (await client.agent.list()).items?.find((a) => a.agent_name === AGENT.name);

// The list endpoint returns slim records, so fetch the full agent for its llm_id.
const full = existing ? await client.agent.retrieve(existing.agent_id) : undefined;
const llmId = full?.response_engine?.type === 'retell-llm' ? full.response_engine.llm_id : undefined;

type LlmParams = Parameters<Retell['llm']['create']>[0];
type AgentParams = Parameters<Retell['agent']['create']>[0];

const llmParams = {
  model: AGENT.model as LlmParams['model'],
  general_prompt: AGENT.prompt,
  // Cast: agent.ts keeps the tool shape loose so it stays readable.
  general_tools: AGENT.tools as LlmParams['general_tools'],
};

const llm = llmId ? await client.llm.update(llmId, llmParams) : await client.llm.create(llmParams);

const agentParams = {
  agent_name: AGENT.name,
  voice_id: AGENT.voice_id,
  language: 'en-US' as const,
  response_engine: { type: 'retell-llm' as const, llm_id: llm.llm_id },
  post_call_analysis_data: AGENT.analysis as AgentParams['post_call_analysis_data'],
};

const agent = existing
  ? await client.agent.update(existing.agent_id, agentParams)
  : await client.agent.create(agentParams);

console.log(`✅ ${existing ? 'Updated' : 'Created'} "${AGENT.name}"\n`);
console.log(`   Put this in .env.local:\n`);
console.log(`   RETELL_AGENT_ID=${agent.agent_id}\n`);
