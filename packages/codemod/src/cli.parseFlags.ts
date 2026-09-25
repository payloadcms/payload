import { parseArgs } from 'node:util'

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
  list: boolean
  path: string
  print: boolean
  tag?: string
  transform?: string
  upgrade?: UpgradeSubcommand
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
      list: { type: 'boolean', default: false },
      print: { type: 'boolean', default: false },
      tag: { type: 'string' },
      transform: { type: 'string' },
    },
  })

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
    list: Boolean(values.list),
    path,
    print: Boolean(values.print),
    tag: values.tag,
    transform: values.transform,
    upgrade,
  }
}

function resolveUpgradeVerb(verb: string | undefined): UpgradeSubcommand {
  if (verb === 'prompt' || verb === 'run') {
    return verb
  }
  return 'dispatch'
}
