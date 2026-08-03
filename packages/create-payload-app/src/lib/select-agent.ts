import * as p from '@clack/prompts'

import type { AgentType, CliArgs } from '../types.js'

type AgentChoice = {
  /** File to write at project root pointing agents to the skill */
  configFile: 'AGENTS.md' | 'CLAUDE.md'
  /** Heading written at the top of the generated config file */
  configHeading: string
  label: string
  value: AgentType
}

export const agentChoices: AgentChoice[] = [
  { configFile: 'CLAUDE.md', configHeading: 'Claude Code', label: 'Claude Code', value: 'claude' },
  { configFile: 'AGENTS.md', configHeading: 'Agents', label: 'Codex', value: 'codex' },
  { configFile: 'AGENTS.md', configHeading: 'Agents', label: 'Cursor', value: 'cursor' },
]

const validAgentValues = agentChoices.map((c) => c.value)

export function getAgentChoice(agentType: AgentType): AgentChoice {
  const choice = agentChoices.find((c) => c.value === agentType)
  if (!choice) {
    throw new Error(`Unknown agent type: ${agentType}`)
  }
  return choice
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
    message: 'Select a coding agent to configure',
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
