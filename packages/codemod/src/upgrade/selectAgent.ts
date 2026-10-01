import { spawnSync } from 'node:child_process'

export type AgentId = 'claude' | 'codex'

export type Agent = {
  /** Executable expected on PATH. */
  command: string
  id: AgentId
  /** Human label shown in the picker. */
  label: string
}

/** Coding agents the dispatcher can hand the orchestration prompt to. */
export const AGENTS: Agent[] = [
  { id: 'claude', command: 'claude', label: 'Claude Code' },
  { id: 'codex', command: 'codex', label: 'Codex' },
]

/**
 * Hand the prompt to `agent`, run the mechanical slice here, or print the
 * prompt to stdout for manual use.
 */
export type DispatchChoice = { agent: Agent; kind: 'agent' } | { kind: 'print' } | { kind: 'run' }

export type SelectDispatchArgs = {
  /** Value of `--agent`, if the user pinned one. */
  agentFlag?: string
  /** Agents found on PATH. */
  installed: Agent[]
  /** Both stdin and stdout are a TTY, so a picker can run. */
  isInteractive: boolean
  /** Interactive picker; only called when a choice is genuinely needed. */
  prompt: (agents: Agent[]) => Promise<DispatchChoice>
}

/**
 * Decide how to dispatch the upgrade, kept pure so the branching is unit-tested
 * without a terminal. `--agent` wins and is strict (unknown or not-installed
 * throws). A non-interactive session falls back to printing the prompt. Any TTY
 * opens the picker, which offers running the mechanical slice or printing even
 * when no agent is installed.
 */
export async function selectDispatch({
  agentFlag,
  installed,
  isInteractive,
  prompt,
}: SelectDispatchArgs): Promise<DispatchChoice> {
  if (agentFlag) {
    const known = AGENTS.find((a) => a.id === agentFlag)
    if (!known) {
      throw new Error(
        `Unknown agent "${agentFlag}". Supported: ${AGENTS.map((a) => a.id).join(', ')}.`,
      )
    }
    if (!installed.some((a) => a.id === known.id)) {
      throw new Error(
        `Agent "${agentFlag}" is not installed (command "${known.command}" not found).`,
      )
    }
    return { agent: known, kind: 'agent' }
  }

  if (!isInteractive) {
    return { kind: 'print' }
  }

  return prompt(installed)
}

/** Filter the registry down to agents whose command resolves on PATH. */
export function detectInstalledAgents(
  isAvailable: (command: string) => boolean = isCommandAvailable,
): Agent[] {
  return AGENTS.filter((agent) => isAvailable(agent.command))
}

/** Cross-platform PATH probe using the OS command locator. */
export function isCommandAvailable(command: string): boolean {
  const locator = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(locator, [command], { stdio: 'ignore' })
  return result.status === 0
}
