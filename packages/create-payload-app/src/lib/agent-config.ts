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
  const { configFile, configHeading } = getAgentChoice(agentType)

  const content = `# ${configHeading}\n\nThis project uses the Payload CMS skill at \`${SKILL_PATH}/\`.\nStart with \`${SKILL_PATH}/SKILL.md\` for a quick reference, then see \`${SKILL_PATH}/reference/\` for detailed docs.\n`

  return { content, fileName: configFile }
}
