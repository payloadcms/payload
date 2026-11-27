import { parseArgs } from 'node:util'

import type { PackageManager } from './upgrade/types.js'

export type CliCommand = 'upgrade'

/**
 * The three `upgrade` verbs:
 * - `dispatch` (bare `upgrade`): interactive picker to hand the orchestration
 *   prompt to a coding agent, or print it.
 * - `run` (`upgrade run`): the deterministic mechanical slice.
 * - `prompt` (`upgrade prompt`): print the orchestration prompt to stdout.
 */
export type UpgradeSubcommand = 'dispatch' | 'prompt' | 'run'

export type CliFlags = {
  agent?: string
  command?: CliCommand
  dry: boolean
  force: boolean
  help: boolean
  list: boolean
  packageManager?: PackageManager
  path: string
  print: boolean
  tag?: string
  transform?: string
  upgrade?: UpgradeSubcommand
  yes: boolean
}

export function parseFlags(argv: string[]): CliFlags {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: argv,
    options: {
      agent: { type: 'string' },
      dry: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false, short: 'h' },
      list: { type: 'boolean', default: false },
      'package-manager': { type: 'string' },
      print: { type: 'boolean', default: false },
      tag: { type: 'string' },
      transform: { type: 'string' },
      yes: { type: 'boolean', default: false },
    },
  })

  const packageManager = values['package-manager']
  if (packageManager && !['bun', 'npm', 'pnpm', 'yarn'].includes(packageManager)) {
    throw new Error('--package-manager must be npm, pnpm, yarn, or bun.')
  }

  const isUpgrade = positionals[0] === 'upgrade'
  const command = isUpgrade ? 'upgrade' : undefined
  const upgrade = isUpgrade ? resolveUpgradeVerb(positionals[1]) : undefined
  // The upgrade command always operates on the current directory; only the bare
  // transform command takes a positional path.
  const path = isUpgrade ? process.cwd() : (positionals[0] ?? process.cwd())

  return {
    agent: values.agent,
    command,
    dry: Boolean(values.dry) || Boolean(values['dry-run']),
    force: Boolean(values.force),
    help: Boolean(values.help),
    list: Boolean(values.list),
    ...(packageManager ? { packageManager: packageManager as PackageManager } : {}),
    path,
    print: Boolean(values.print),
    tag: values.tag,
    transform: values.transform,
    upgrade,
    yes: Boolean(values.yes),
  }
}

function resolveUpgradeVerb(verb: string | undefined): UpgradeSubcommand {
  if (verb === 'prompt' || verb === 'run') {
    return verb
  }
  return 'dispatch'
}
