#!/usr/bin/env node
import { parseArgs } from 'node:util'

import { runPlan } from './commands/plan.mjs'
import { runPrBody } from './commands/pr.mjs'
import {
  runBuildResearchPrompt,
  runCheckResearch,
  runEvidence,
  runSelectBumps,
} from './commands/research.mjs'
import { escapeCommandMessage } from './commands/shared.mjs'
import { runOutcomes, runStoreUpdate } from './commands/status.mjs'
import { runApplyBumps, runCheckCleared, runPathGuard } from './commands/verify.mjs'

const OPTION_NAMES = [
  'bump',
  'bump-ids',
  'cwd',
  'evidence-dir',
  'out',
  'out-dir',
  'plan',
  'ref',
  'report',
  'research-dir',
  'result',
  'run-url',
  'scope',
  'severity',
  'skill',
  'store',
  'template',
  'unit',
  'unit-steps',
  'verify-dir',
]

// One entry per workflow step; each command documents its options on its run function.
const COMMANDS = {
  'apply-bumps': runApplyBumps,
  'build-research-prompt': runBuildResearchPrompt,
  'check-cleared': runCheckCleared,
  'check-research': runCheckResearch,
  evidence: runEvidence,
  outcomes: runOutcomes,
  'path-guard': runPathGuard,
  plan: runPlan,
  'pr-body': runPrBody,
  'select-bumps': runSelectBumps,
  'store-update': runStoreUpdate,
}

main().catch((error) => {
  process.stdout.write(`::error::${escapeCommandMessage({ message: errorMessage({ error }) })}\n`)
  process.exitCode = 1
})

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: Object.fromEntries(OPTION_NAMES.map((name) => [name, { type: 'string' }])),
  })

  const name = positionals[0]
  if (!Object.hasOwn(COMMANDS, name ?? '')) {
    throw new Error(`unknown command: ${name}`)
  }

  await COMMANDS[name]({ options: values })
}

function errorMessage({ error }) {
  return error instanceof Error ? error.message : String(error)
}
