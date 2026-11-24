/* eslint-disable no-console */
import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import type { UpgradePlan } from '../upgrade-shared/index.js'
import type { Agent, DispatchChoice } from './selectAgent.js'

import { runUpgrade } from './index.js'
import { prepareUpgrade } from './prepare.js'
import { renderUpgradePrompt } from './prompt.js'
import { detectInstalledAgents, selectDispatch } from './selectAgent.js'
import { resolveSelfCommand } from './selfCommand.js'

type UpgradeFlags = Parameters<typeof runUpgrade>[0]['flags']

type RunDispatchArgs = {
  agentFlag?: string
  path: string
  upgradeFlags: UpgradeFlags
}

export type DispatchDeps = {
  detectAgents: () => Agent[]
  isInteractive: boolean
  prepare: (args: {
    packageManager?: UpgradeFlags['packageManager']
    path: string
    shouldConfirm: boolean
    tag?: string
  }) => Promise<undefined | UpgradePlan>
  promptChoice: (agents: Agent[]) => Promise<DispatchChoice>
  renderPrompt: (
    plan: UpgradePlan,
    options?: Pick<UpgradeFlags, 'packageManager' | 'yes'>,
  ) => string
  runMechanical: (args: {
    flags: UpgradeFlags
    path: string
    plan?: UpgradePlan
  }) => Promise<{ failed: boolean }>
  spawnAgent: (args: { agent: Agent; cwd: string; promptFilePath: string }) => Promise<{
    code: number
  }>
  writePromptFile: (contents: string) => string
}

/** Detect and preview the upgrade before choosing an agent, mechanical run, or printed prompt. */
export async function runDispatch(
  { agentFlag, path, upgradeFlags }: RunDispatchArgs,
  deps: DispatchDeps = defaultDispatchDeps(),
): Promise<{ failed: boolean }> {
  let choice: DispatchChoice
  let plan: undefined | UpgradePlan
  try {
    plan = await deps.prepare({
      path,
      ...(upgradeFlags.packageManager ? { packageManager: upgradeFlags.packageManager } : {}),
      shouldConfirm: !upgradeFlags.dry && !upgradeFlags.yes,
      tag: upgradeFlags.tag,
    })
    if (!plan) {
      return { failed: false }
    }
    if (upgradeFlags.dry) {
      return deps.runMechanical({ flags: { ...upgradeFlags, tag: plan.targetVersion }, path, plan })
    }
    const installed = deps.detectAgents()
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

  if (choice.kind === 'run') {
    return deps.runMechanical({ flags: { ...upgradeFlags, tag: plan.targetVersion }, path, plan })
  }

  const promptText =
    upgradeFlags.yes || upgradeFlags.packageManager
      ? deps.renderPrompt(plan, {
          ...(upgradeFlags.yes ? { yes: true } : {}),
          ...(upgradeFlags.packageManager ? { packageManager: upgradeFlags.packageManager } : {}),
        })
      : deps.renderPrompt(plan)

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
    prepare: prepareUpgrade,
    promptChoice: promptChoiceFromTerminal,
    renderPrompt: (plan, options = {}) =>
      renderUpgradePrompt({
        command: resolveSelfCommand(),
        currentVersion: plan.project.currentVersion,
        hasNext: plan.project.dependencies.some(
          ({ name }) => name === 'next' || name === '@payloadcms/next',
        ),
        kind: plan.kind,
        targetVersion: plan.targetVersion,
        ...options,
      }),
    runMechanical: (args) => runUpgrade(args),
    spawnAgent: spawnAgentInteractive,
    writePromptFile: (contents) => {
      const dir = mkdtempSync(join(tmpdir(), 'payload-upgrade-'))
      const filePath = join(dir, 'prompt.md')
      writeFileSync(filePath, contents)
      return filePath
    },
  }
}

/** Clack select: each installed agent, then run the slice or print the prompt. */
async function promptChoiceFromTerminal(agents: Agent[]): Promise<DispatchChoice> {
  p.intro('Payload upgrade')
  const selection = await p.select({
    message: 'How do you want to run it?',
    options: [
      ...agents.map((agent) => ({
        hint: `hand the prompt to \`${agent.command}\``,
        label: agent.label,
        value: agent.id,
      })),
      {
        hint: 'install the selected versions and run any required migration',
        label: 'Run the mechanical steps',
        value: 'run',
      },
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
  if (selection === 'run') {
    return { kind: 'run' }
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
  const launchPrompt = `Read ${promptFilePath} and follow it to carry out the selected Payload upgrade.`
  return new Promise((resolveSpawn) => {
    const child = spawn(agent.command, [launchPrompt], { cwd, shell: false, stdio: 'inherit' })
    child.on('close', (code) => resolveSpawn({ code: code ?? 1 }))
    child.on('error', () => resolveSpawn({ code: 1 }))
  })
}
