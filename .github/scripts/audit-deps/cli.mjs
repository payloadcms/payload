#!/usr/bin/env node
import { parseArgs } from 'node:util'

import { runPlan } from './commands/plan.mjs'
import { runPreparePrs } from './commands/prepare.mjs'
import { errorMessage, escapeCommandMessage } from './commands/shared.mjs'

const OPTION_NAMES = [
  'cwd',
  'out',
  'out-dir',
  'plan',
  'pr-steps-json',
  'ref',
  'report',
  'run-url',
  'scope',
  'severity',
]

// One entry per workflow step; each command documents its options on its run function.
const COMMANDS = {
  plan: runPlan,
  'prepare-prs': runPreparePrs,
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
