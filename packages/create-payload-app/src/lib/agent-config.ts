/** Where the skill ships inside a consumer's installed dependencies. */
const SKILL_PATH = 'node_modules/payload/skills/payload'

type AgentConfigFile = {
  content: string
  fileName: 'AGENTS.md'
}

/**
 * Builds the agent config files written at project root. They point agents at the skill
 * bundled with the installed `payload` package, so guidance always matches the installed
 * version. `AGENTS.md` is the single source read by Claude Code, Cursor, and Copilot.
 */
export function buildAgentConfigFiles(): AgentConfigFile[] {
  return [
    {
      content: `# AI Agent\n\nFor any Payload-related work, reference the skill at \`${SKILL_PATH}/SKILL.md\`.\n`,
      fileName: 'AGENTS.md',
    },
  ]
}
