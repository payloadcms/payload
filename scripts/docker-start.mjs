#!/usr/bin/env node
// Interactive or non-interactive picker for docker services.
//
// Usage:
//   pnpm docker:start                       # interactive checkbox picker
//   pnpm docker:start all                   # start everything (--profile all)
//   pnpm docker:start postgres mongodb      # start specific profiles
//   pnpm docker:start --help
//
// Profiles map 1:1 to the profiles defined in test/docker-compose.yml.

import { spawn } from 'node:child_process'
import { emitKeypressEvents } from 'node:readline'

const COMPOSE_FILE = 'test/docker-compose.yml'

/** @type {{ name: string; label: string; ports: string }[]} */
const PROFILES = [
  { name: 'postgres', label: 'PostgreSQL + read replica', ports: '5433, 5434' },
  { name: 'mongodb', label: 'MongoDB Community + mongot', ports: '27018' },
  { name: 'mongodb-atlas', label: 'MongoDB Atlas Local', ports: '27019' },
  { name: 'storage', label: 'LocalStack, Azurite, fake-GCS, Vercel Blob', ports: '4443, 3100, 4566, 10000' },
]
const VALID_PROFILES = new Set([...PROFILES.map((p) => p.name), 'all'])

function usage() {
  const list = PROFILES.map((p) => `  ${p.name.padEnd(15)} ${p.label} (${p.ports})`).join('\n')
  process.stdout.write(`
Usage:
  pnpm docker:start                      # interactive picker
  pnpm docker:start all                  # start every service
  pnpm docker:start <profile>...         # start specific profiles

Profiles:
${list}
  all             Everything above

`)
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))))
    p.on('error', reject)
  })
}

async function startProfiles(profiles) {
  for (const profile of profiles) {
    process.stdout.write(`\n\x1b[36m▶\x1b[0m Starting profile '\x1b[1m${profile}\x1b[0m'...\n`)
    await run('docker', ['compose', '-f', COMPOSE_FILE, '--profile', profile, 'up', '-d', '--wait'])
  }
}

function pickInteractive() {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      process.stderr.write(
        '\x1b[31mError:\x1b[0m No arguments provided and not a TTY.\n' +
          'Pass services as args, e.g. `pnpm docker:start postgres`, or use `pnpm docker:start --help`.\n',
      )
      process.exit(1)
    }

    const items = PROFILES
    const selected = new Set()
    let cursor = 0
    let prevLines = 0

    const render = () => {
      if (prevLines > 0) {
        process.stdout.write(`\x1b[${prevLines}A\x1b[0J`)
      }
      const lines = [
        '\x1b[1m?\x1b[0m Select services to start ' +
          '\x1b[2m(space: toggle, a: toggle all, enter: confirm, q/esc: cancel)\x1b[0m',
        '',
      ]
      for (let i = 0; i < items.length; i++) {
        const isCursor = i === cursor
        const check = selected.has(items[i].name) ? '\x1b[32m◉\x1b[0m' : '\x1b[2m◯\x1b[0m'
        const pointer = isCursor ? '\x1b[36m❯\x1b[0m' : ' '
        const name = isCursor ? `\x1b[36m${items[i].name}\x1b[0m` : items[i].name
        const padName = name + ' '.repeat(Math.max(0, 18 - items[i].name.length))
        lines.push(`  ${pointer} ${check} ${padName} \x1b[2m${items[i].label} (${items[i].ports})\x1b[0m`)
      }
      process.stdout.write(lines.join('\n') + '\n')
      prevLines = lines.length
    }

    const cleanup = () => {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.removeListener('keypress', onKey)
    }

    const onKey = (_str, key) => {
      if (!key) return
      if (key.ctrl && key.name === 'c') {
        cleanup()
        process.stdout.write('\n')
        process.exit(130)
      }
      if (key.name === 'q' || key.name === 'escape') {
        cleanup()
        process.stdout.write('\n')
        resolve([])
        return
      }
      if (key.name === 'up' || key.name === 'k') {
        cursor = (cursor - 1 + items.length) % items.length
        render()
      } else if (key.name === 'down' || key.name === 'j') {
        cursor = (cursor + 1) % items.length
        render()
      } else if (key.name === 'space') {
        const n = items[cursor].name
        if (selected.has(n)) selected.delete(n)
        else selected.add(n)
        render()
      } else if (key.name === 'a') {
        if (selected.size === items.length) selected.clear()
        else items.forEach((i) => selected.add(i.name))
        render()
      } else if (key.name === 'return') {
        cleanup()
        process.stdout.write('\n')
        if (selected.size === items.length) resolve(['all'])
        else resolve([...selected])
      }
    }

    emitKeypressEvents(process.stdin)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('keypress', onKey)
    render()
  })
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    usage()
    return
  }

  let profiles
  if (args.length === 0) {
    profiles = await pickInteractive()
  } else {
    const invalid = args.filter((a) => !VALID_PROFILES.has(a))
    if (invalid.length) {
      process.stderr.write(`\x1b[31mError:\x1b[0m Unknown profile(s): ${invalid.join(', ')}\n`)
      usage()
      process.exit(1)
    }
    profiles = args.includes('all') ? ['all'] : args
  }

  if (!profiles.length) {
    process.stdout.write('\x1b[2mNo services selected. Nothing to do.\x1b[0m\n')
    return
  }

  await startProfiles(profiles)
  process.stdout.write('\n\x1b[32m✓\x1b[0m Services started.\n')
}

main().catch((err) => {
  process.stderr.write(`\n\x1b[31m✗\x1b[0m ${err.message}\n`)
  process.exit(1)
})
