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
  const { path, upgrade } = resolveUpgrade(isUpgrade, positionals)

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

/**
 * Resolve the upgrade verb and its path. `prompt`/`run` consume positional 1,
 * shifting the path to positional 2; a bare `upgrade` is the dispatch verb with
 * the path at positional 1. Non-upgrade invocations read the path at positional 0.
 */
function resolveUpgrade(
  isUpgrade: boolean,
  positionals: string[],
): { path: string; upgrade?: UpgradeSubcommand } {
  if (!isUpgrade) {
    return { path: positionals[0] ?? process.cwd() }
  }
  const verb = positionals[1]
  if (verb === 'prompt' || verb === 'run') {
    return { path: positionals[2] ?? process.cwd(), upgrade: verb }
  }
  return { path: positionals[1] ?? process.cwd(), upgrade: 'dispatch' }
}
