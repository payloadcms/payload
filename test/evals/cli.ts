// Interactive / flag-driven launcher for the Payload eval suite.
//
// Usage:
//   pnpm test:eval                                          # interactive picker
//   pnpm test:eval --runner=llm --skill=on --suite=collections
//   pnpm test:eval --suite=fields --model=anthropic:claude-opus-4-8
//   pnpm test:eval --suite=all --no-cache -t cors-serverurl
//   pnpm test:eval --help
//
// Any option omitted on the command line is prompted for (when run in a TTY).
// In a non-TTY (CI) the defaults are used: runner=llm, skill=on, suite=all.
// Selections are turned into the EVAL_RUNNER / EVAL_SKILL / EVAL_MODEL env vars
// that test/evals/variantOptions.ts reads — this is just a front-end for them.

import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'

type Suite = { label: string; spec?: string; value: string }

const SUITES: Suite[] = [
  { label: 'All suites', value: 'all' },
  { label: 'Collections', spec: 'eval.collections.spec', value: 'collections' },
  { label: 'Fields', spec: 'eval.fields.spec', value: 'fields' },
  { label: 'Config', spec: 'eval.config.spec', value: 'config' },
  { label: 'Negative', spec: 'eval.negative.spec', value: 'negative' },
  { label: 'Official plugins', spec: 'eval.official-plugins.spec', value: 'official-plugins' },
  { label: 'Building plugins', spec: 'eval.building-plugins.spec', value: 'building-plugins' },
]

const RUNNERS = [
  { hint: 'AI SDK call', label: 'Direct LLM', value: 'llm' },
  { hint: 'agent', label: 'Claude Code CLI', value: 'claude-code' },
]

// Keep in sync with MODELS in models.ts (the llm lane) — "Custom…" reaches any
// value, and variantOptions validates, so a stale entry here is non-fatal.
const LLM_MODELS = [
  'anthropic:claude-sonnet-4-6',
  'anthropic:claude-opus-4-8',
  'anthropic:claude-haiku-4-5',
  'openai:gpt-5.2',
  'openai:gpt-4o-mini',
]
const CLI_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5']

const USAGE = `
Usage:
  pnpm test:eval                                  # interactive picker
  pnpm test:eval --runner=llm --skill=on --suite=collections
  pnpm test:eval --suite=fields --model=anthropic:claude-opus-4-8
  pnpm test:eval --suite=all --no-cache -t <name>

Flags (any omitted flag is prompted for in a TTY):
  --runner=llm|claude-code   harness (default llm)
  --skill=on|off             provide the Payload skill (default on)
  --model=<id>               runner model override; llm: a models.ts key, claude-code: a --model name
  --suite=<name>             ${SUITES.map((s) => s.value).join(' | ')}
  --no-cache                 bypass the result cache (EVAL_NO_CACHE)
  -t, --test=<name>          only run cases matching <name>
`

type ParsedArgs = {
  model?: string
  noCache: boolean
  runner?: string
  skill?: string
  suite?: string
  testPattern?: string
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { noCache: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-t') {
      out.testPattern = argv[++i]
      continue
    }
    const eq = arg.match(/^--([a-z-]+)=(.*)$/)
    const key = eq ? eq[1] : arg.replace(/^--/, '')
    const value = () => (eq ? eq[2] : argv[++i])
    switch (key) {
      case 'model':
        out.model = value()
        break
      case 'no-cache':
        out.noCache = true
        break
      case 'runner':
        out.runner = value()
        break
      case 'skill':
        out.skill = value()
        break
      case 'suite':
        out.suite = value()
        break
      case 'test':
        out.testPattern = value()
        break
      default:
        throw new Error(`Unknown argument: ${arg}\n${USAGE}`)
    }
  }
  return out
}

async function pick(
  message: string,
  options: Array<{ hint?: string; label: string; value: string }>,
  initialValue: string,
): Promise<string> {
  const value = await p.select({ initialValue, message, options })
  if (p.isCancel(value)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  return value
}

async function pickModel(runner: string): Promise<string | undefined> {
  const known = runner === 'claude-code' ? CLI_MODELS : LLM_MODELS
  const choice = await pick(
    'Model override',
    [
      { hint: 'no EVAL_MODEL', label: 'Default (auto by key)', value: '' },
      ...known.map((m) => ({ label: m, value: m })),
      { label: 'Custom…', value: '__custom__' },
    ],
    '',
  )
  if (choice !== '__custom__') {
    return choice || undefined
  }
  const typed = await p.text({
    message: 'Model id',
    placeholder: runner === 'claude-code' ? 'claude-opus-4-6' : 'anthropic:claude-sonnet-4-6',
  })
  if (p.isCancel(typed)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  return typed || undefined
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USAGE + '\n')
    return
  }

  const args = parseArgs(argv)
  const tty = Boolean(process.stdin.isTTY)
  if (tty) {
    p.intro('Payload evals')
  }

  const runner = args.runner ?? (tty ? await pick('Runner', RUNNERS, 'llm') : 'llm')
  if (runner !== 'llm' && runner !== 'claude-code') {
    throw new Error(`--runner must be "llm" or "claude-code", got "${runner}"`)
  }

  const skill =
    args.skill ??
    (tty
      ? await pick(
          'Skill',
          [
            { label: 'On (inject the skill)', value: 'on' },
            { label: 'Off (baseline)', value: 'off' },
          ],
          'on',
        )
      : 'on')
  if (skill !== 'on' && skill !== 'off') {
    throw new Error(`--skill must be "on" or "off", got "${skill}"`)
  }

  const suiteValue =
    args.suite ??
    (tty
      ? await pick(
          'Suite',
          SUITES.map((s) => ({ label: s.label, value: s.value })),
          'all',
        )
      : 'all')
  const suite = SUITES.find((s) => s.value === suiteValue)
  if (!suite) {
    throw new Error(
      `--suite must be one of: ${SUITES.map((s) => s.value).join(', ')}, got "${suiteValue}"`,
    )
  }

  // Model is optional; only prompt when not given and we're interactive.
  const model = args.model ?? (tty ? await pickModel(runner) : undefined)

  const vitestArgs = ['exec', 'vitest', '--run', '--project', 'eval']
  if (suite.spec) {
    vitestArgs.push(suite.spec)
  }
  if (args.testPattern) {
    vitestArgs.push('-t', args.testPattern)
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    EVAL_RUNNER: runner,
    EVAL_SKILL: skill,
    NODE_NO_WARNINGS: '1',
    NODE_OPTIONS: '--no-deprecation --no-experimental-strip-types',
  }
  if (model) {
    env.EVAL_MODEL = model
  }
  if (args.noCache) {
    env.EVAL_NO_CACHE = 'true'
  }

  if (tty) {
    p.outro(
      `▶ runner=${runner} · skill=${skill} · suite=${suiteValue}` +
        `${model ? ` · model=${model}` : ''}${args.noCache ? ' · no-cache' : ''}` +
        `${args.testPattern ? ` · -t ${args.testPattern}` : ''}`,
    )
  }

  const child = spawn('pnpm', vitestArgs, { env, stdio: 'inherit' })
  child.on('error', (err) => {
    process.stderr.write(`Failed to launch vitest: ${err.message}\n`)
    process.exit(1)
  })
  child.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((err: unknown) => {
  p.cancel(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
