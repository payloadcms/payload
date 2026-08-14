import { parseArgs } from 'node:util'

export type CliCommand = 'upgrade'

export type CliFlags = {
  command?: CliCommand
  dry: boolean
  emitPrompt: boolean
  force: boolean
  list: boolean
  path: string
  print: boolean
  tag?: string
  transform?: string
}

export function parseFlags(argv: string[]): CliFlags {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: argv,
    options: {
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
  // `upgrade prompt [path]` emits the orchestration prompt; `prompt` consumes
  // positional 1, shifting the path to positional 2.
  const emitPrompt = isUpgrade && positionals[1] === 'prompt'
  const upgradePath = emitPrompt ? positionals[2] : positionals[1]
  // When `upgrade` is present it consumes positional 0; the path shifts to positional 1.
  const path = (isUpgrade ? upgradePath : positionals[0]) ?? process.cwd()

  return {
    command,
    dry: Boolean(values.dry) || Boolean(values['dry-run']),
    emitPrompt,
    force: Boolean(values.force),
    list: Boolean(values.list),
    path,
    print: Boolean(values.print),
    tag: values.tag,
    transform: values.transform,
  }
}
