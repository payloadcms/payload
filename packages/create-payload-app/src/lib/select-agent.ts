import * as p from '@clack/prompts'

import type { AgentType, CliArgs } from '../types.js'

type AgentChoice = {
  label: string
  skillsDir: string
  value: AgentType
}

export const agentChoices: AgentChoice[] = [
  { label: 'Claude Code', skillsDir: '.claude/skills', value: 'claude' },
  { label: 'Codex', skillsDir: '.agents/skills', value: 'codex' },
  { label: 'Cursor', skillsDir: '.agents/skills', value: 'cursor' },
]

const validAgentValues = agentChoices.map((c) => c.value)

export function getSkillsDir(agentType: AgentType): string {
  const choice = agentChoices.find((c) => c.value === agentType)
  if (!choice) {
    throw new Error(`Unknown agent type: ${agentType}`)
  }
  return choice.skillsDir
}

export async function selectAgent(args: { cliArgs: CliArgs }): Promise<AgentType | undefined> {
  const { cliArgs } = args

  if (cliArgs['--no-agent']) {
    return undefined
  }

  if (cliArgs['--agent']) {
    const value = cliArgs['--agent'] as AgentType
    if (!validAgentValues.includes(value)) {
      throw new Error(
        `Invalid agent type: ${cliArgs['--agent']}. Valid types are: ${validAgentValues.join(', ')}`,
      )
    }
    return value
  }

  const selected = await p.select<
    { label: string; value: 'none' | AgentType }[],
    'none' | AgentType
  >({
    message: 'Select a coding agent to install the Payload skill for',
    options: [
      ...agentChoices.map((choice) => ({
        label: choice.label,
        value: choice.value,
      })),
      { label: 'None', value: 'none' as const },
    ],
  })

  if (p.isCancel(selected)) {
    process.exit(0)
  }

  if (selected === 'none') {
    return undefined
  }

  return selected
}
