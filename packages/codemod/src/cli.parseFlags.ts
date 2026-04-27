import { parseArgs } from 'node:util'

export type CliFlags = {
  dry: boolean
  list: boolean
  path: string
  print: boolean
  transform?: string
}

export function parseFlags(argv: string[]): CliFlags {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: argv,
    options: {
      dry: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
      print: { type: 'boolean', default: false },
      transform: { type: 'string' },
    },
  })

  return {
    dry: Boolean(values.dry) || Boolean(values['dry-run']),
    list: Boolean(values.list),
    path: positionals[0] ?? process.cwd(),
    print: Boolean(values.print),
    transform: values.transform,
  }
}
