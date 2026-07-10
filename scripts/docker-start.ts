// Interactive or non-interactive picker for docker services.
//
// Usage:
//   pnpm docker:start                  # interactive multiselect
//   pnpm docker:start all              # start everything
//   pnpm docker:start postgres mongodb # specific profiles
//   pnpm docker:start --help

import * as p from '@clack/prompts'

import { dbAdapters } from '../test/dbAdapters.ts'
import { cleanAll, compose } from './docker-lib.ts'

// Collect unique ports per docker-compose profile by walking dbAdapters.
const portHint = (profile: string) => {
  const ports = new Set<number>()
  for (const a of Object.values(dbAdapters)) {
    if ('profile' in a && a.profile === profile && 'port' in a && typeof a.port === 'number') {
      ports.add(a.port)
    }
  }
  return [...ports].sort((x, y) => x - y).join(', ')
}

const PROFILES = [
  { name: 'postgres', label: 'PostgreSQL + read replica', hint: portHint('postgres') },
  { name: 'mongodb', label: 'MongoDB Community + mongot', hint: portHint('mongodb') },
  { name: 'mongodb-atlas', label: 'MongoDB Atlas Local', hint: portHint('mongodb-atlas') },
  {
    name: 'storage',
    label: 'LocalStack, Azurite, fake-GCS, Vercel Blob',
    hint: '4443, 3100, 4566, 10000',
  },
] as const

const VALID = new Set<string>(['all', ...PROFILES.map((x) => x.name)])

const USAGE = `
Usage:
  pnpm docker:start                      # interactive picker
  pnpm docker:start all                  # start every service
  pnpm docker:start <profile>...         # start specific profiles

Profiles:
${PROFILES.map((x) => `  ${x.name.padEnd(15)} ${x.label} (${x.hint})`).join('\n')}
  all             Everything above
`

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(USAGE + '\n')
    return
  }

  let profiles: string[]
  if (args.length === 0) {
    if (!process.stdin.isTTY) {
      process.stderr.write('Error: No arguments and not a TTY. Run `pnpm docker:start --help`.\n')
      process.exit(1)
    }
    p.intro('Payload docker services')
    const selection = await p.multiselect<string>({
      message: 'Select services to start \x1b[2m(space: toggle, a: all, enter: confirm)\x1b[0m',
      options: PROFILES.map((x) => ({ value: x.name, label: x.label, hint: x.hint })),
      required: false,
    })
    if (p.isCancel(selection)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    profiles = selection.length === PROFILES.length ? ['all'] : selection
  } else {
    const invalid = args.filter((a) => !VALID.has(a))
    if (invalid.length) {
      process.stderr.write(`Unknown profile(s): ${invalid.join(', ')}\n${USAGE}`)
      process.exit(1)
    }
    profiles = args.includes('all') ? ['all'] : args
  }

  if (!profiles.length) {
    p.outro('No services selected.')
    return
  }

  p.log.step('Removing containers and wiping volumes')
  await cleanAll()

  p.log.step(`Starting ${profiles.join(', ')}`)
  await compose(profiles, 'up', '-d', '--wait')

  p.outro('✓ Services started.')
}

main().catch((err: unknown) => {
  p.cancel(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
