import type { AgentType } from '../types.js'

import { getAgentChoice } from './select-agent.js'

/** Where the skill ships inside a consumer's installed dependencies. */
const SKILL_PATH = 'node_modules/payload/skills/payload'

/**
 * Builds the agent config file written at project root. The file points agents at the
 * skill bundled with the installed `payload` package, so guidance always matches the
 * installed version.
 */
export function buildAgentConfigFile(agentType: AgentType): {
  content: string
  fileName: 'AGENTS.md' | 'CLAUDE.md'
} {
  const { configFile } = getAgentChoice(agentType)

  const content = `# AI Agent\n\nFor any Payload-related work, reference the skill at \`${SKILL_PATH}/\`.\n`

  return { content, fileName: configFile }
}
