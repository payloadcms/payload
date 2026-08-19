/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'

import type { Agent, DispatchChoice } from './selectAgent.js'

import { renderUpgradePrompt } from './prompt.js'
import { detectInstalledAgents, selectDispatch } from './selectAgent.js'

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
    renderPrompt: renderUpgradePrompt,
    spawnAgent: spawnAgentInteractive,
    writePromptFile: (contents) => {
      const dir = mkdtempSync(join(tmpdir(), 'payload-v4-upgrade-'))
      const filePath = join(dir, 'prompt.md')
      writeFileSync(filePath, contents)
      return filePath
    },
  }
}

/** Numbered readline picker: each installed agent, then "print the prompt". */
async function promptChoiceFromTerminal(agents: Agent[]): Promise<DispatchChoice> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    console.log('How do you want to run the Payload v3 -> v4 upgrade?')
    agents.forEach((agent, i) => console.log(`  ${i + 1}) Hand off to ${agent.label}`))
    console.log(`  ${agents.length + 1}) Just print the prompt`)

    const answer = await rl.question(`Select [1-${agents.length + 1}]: `)
    const index = Number.parseInt(answer.trim(), 10) - 1
    const agent = agents[index]
    return agent ? { agent, kind: 'agent' } : { kind: 'print' }
  } finally {
    rl.close()
  }
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
