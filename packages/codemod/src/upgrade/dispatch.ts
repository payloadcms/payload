/* eslint-disable no-console */
import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import type { Agent, DispatchChoice } from './selectAgent.js'

import { renderUpgradePrompt } from './prompt.js'
import { detectInstalledAgents, selectDispatch } from './selectAgent.js'
import { resolveSelfCommand } from './selfCommand.js'

type RunDispatchArgs = {
  agentFlag?: string
  path: string
}

export type DispatchDeps = {
  detectAgents: () => Agent[]
  isInteractive: boolean
  promptChoice: (agents: Agent[]) => Promise<DispatchChoice>
  renderPrompt: () => string
  spawnAgent: (args: { agent: Agent; cwd: string; promptFilePath: string }) => Promise<{
    code: number
  }>
  writePromptFile: (contents: string) => string
}

/**
 * Bare `upgrade`: pick how to run the full v3 -> v4 upgrade. Hands the
 * orchestration prompt to a detected coding agent, or prints it for manual use.
 * The mechanical slice itself runs later, when the agent (or the user) invokes
 * `upgrade run` per the prompt's step 2.
 */
export async function runDispatch(
  { agentFlag, path }: RunDispatchArgs,
  deps: DispatchDeps = defaultDispatchDeps(),
): Promise<{ failed: boolean }> {
  const installed = deps.detectAgents()

  let choice: DispatchChoice
  try {
    choice = await selectDispatch({
      agentFlag,
      installed,
      isInteractive: deps.isInteractive,
      prompt: deps.promptChoice,
    })
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    return { failed: true }
  }

  const promptText = deps.renderPrompt()

  if (choice.kind === 'print') {
    console.log(promptText)
    return { failed: false }
  }

  const promptFilePath = deps.writePromptFile(promptText)
  console.log(`Handing the upgrade prompt to ${choice.agent.label}...`)
  const { code } = await deps.spawnAgent({
    agent: choice.agent,
    cwd: resolve(path),
    promptFilePath,
  })
  return { failed: code !== 0 }
}

function defaultDispatchDeps(): DispatchDeps {
  return {
    detectAgents: detectInstalledAgents,
    isInteractive: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    promptChoice: promptChoiceFromTerminal,
    renderPrompt: () => renderUpgradePrompt({ command: resolveSelfCommand() }),
    spawnAgent: spawnAgentInteractive,
    writePromptFile: (contents) => {
      const dir = mkdtempSync(join(tmpdir(), 'payload-v4-upgrade-'))
      const filePath = join(dir, 'prompt.md')
      writeFileSync(filePath, contents)
      return filePath
    },
  }
}

/** Clack select: each installed agent, then "print the prompt". */
async function promptChoiceFromTerminal(agents: Agent[]): Promise<DispatchChoice> {
  p.intro('Payload v3 -> v4 upgrade')
  const selection = await p.select({
    message: 'How do you want to run it?',
    options: [
      ...agents.map((agent) => ({
        hint: `hand the prompt to \`${agent.command}\``,
        label: agent.label,
        value: agent.id as string,
      })),
      {
        hint: 'run it yourself or paste it elsewhere',
        label: 'Just print the prompt',
        value: 'print',
      },
    ],
  })

  // Cancelling (Ctrl-C) falls back to printing the prompt so the user keeps it.
  if (p.isCancel(selection)) {
    return { kind: 'print' }
  }
  const agent = agents.find((a) => a.id === selection)
  return agent ? { agent, kind: 'agent' } : { kind: 'print' }
}

/** Interactive agent session seeded with a one-line pointer to the prompt file. */
function spawnAgentInteractive({
  agent,
  cwd,
  promptFilePath,
}: {
  agent: Agent
  cwd: string
  promptFilePath: string
}): Promise<{ code: number }> {
  const launchPrompt = `Read ${promptFilePath} and follow it to upgrade this project from Payload v3 to v4.`
  return new Promise((resolveSpawn) => {
    const child = spawn(agent.command, [launchPrompt], { cwd, shell: false, stdio: 'inherit' })
    child.on('close', (code) => resolveSpawn({ code: code ?? 1 }))
    child.on('error', () => resolveSpawn({ code: 1 }))
  })
}
