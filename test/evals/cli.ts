// Interactive / flag-driven launcher for the Payload eval suite.
//
// Usage:
//   pnpm test:eval                                          # interactive picker
//   pnpm test:eval --runner=llm --skill=on --suite=collections
//   pnpm test:eval --suite=fields --model=anthropic:claude-opus-4-8
//   pnpm test:eval --suite=all --rerun -t cors-serverurl
//   pnpm test:eval --help
//
// Any option omitted on the command line is prompted for (when run in a TTY).
// In a non-TTY (CI) the defaults are used: runner=llm, skill=on, suite=all.
// Selections are turned into the EVAL_RUNNER / EVAL_SKILL / EVAL_MODEL env vars
// that test/evals/variantOptions.ts reads — this is just a front-end for them.

import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'payload/node'

import type { EvalCase } from './types.js'

import { collectionsCodegenDataset } from './datasets/collections/codegen.js'
import { configCodegenDataset } from './datasets/config/codegen.js'
import { fieldsCodegenDataset } from './datasets/fields/codegen.js'
import { mcpDataset } from './datasets/mcp.js'
import {
  negativeCorrectionCodegenDataset,
  negativeInvalidInstructionDataset,
} from './datasets/negative/codegen.js'
import { pluginsCodegenDataset } from './datasets/plugins/codegen.js'
import { pluginsOfficialCodegenDataset } from './datasets/plugins/official/codegen.js'
import { codegenParamsHash } from './paramsHash.js'
import { getAgentVersion } from './runner/claudeCode.js'
import { readRunResults } from './runResults.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')
const runsDir = path.join(__dirname, 'eval-results', 'runs')

type Suite = { cases: EvalCase[]; label: string; spec?: string; value: string }

const allCases = [
  ...collectionsCodegenDataset,
  ...fieldsCodegenDataset,
  ...configCodegenDataset,
  ...mcpDataset,
  ...negativeCorrectionCodegenDataset,
  ...negativeInvalidInstructionDataset,
  ...pluginsOfficialCodegenDataset,
  ...pluginsCodegenDataset,
]

const SUITES: Suite[] = [
  { cases: allCases, label: 'All suites', value: 'all' },
  {
    cases: collectionsCodegenDataset,
    label: 'Collections',
    spec: 'eval.collections.spec',
    value: 'collections',
  },
  { cases: fieldsCodegenDataset, label: 'Fields', spec: 'eval.fields.spec', value: 'fields' },
  { cases: configCodegenDataset, label: 'Config', spec: 'eval.config.spec', value: 'config' },
  { cases: mcpDataset, label: 'MCP', spec: 'eval.mcp.spec', value: 'mcp' },
  {
    cases: [...negativeCorrectionCodegenDataset, ...negativeInvalidInstructionDataset],
    label: 'Negative',
    spec: 'eval.negative.spec',
    value: 'negative',
  },
  {
    cases: pluginsOfficialCodegenDataset,
    label: 'Official plugins',
    spec: 'eval.official-plugins.spec',
    value: 'official-plugins',
  },
  {
    cases: pluginsCodegenDataset,
    label: 'Building plugins',
    spec: 'eval.building-plugins.spec',
    value: 'building-plugins',
  },
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
  pnpm test:eval --suite=all --rerun -t <name>

Flags (any omitted flag is prompted for in a TTY):
  --runner=llm|claude-code   harness (default llm)
  --skill=on|off             provide the Payload skill (default on)
  --model=<id>               runner model override; llm: a models.ts key, claude-code: a --model name
  --suite=<name>             ${SUITES.map((s) => s.value).join(' | ')}
  --rerun                    run cases even when identical parameters were already evaluated
  -t, --test=<name>          only run cases matching <name>
`

type ParsedArgs = {
  model?: string
  rerun: boolean
  runner?: string
  skill?: string
  suite?: string
  testPattern?: string
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { rerun: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg) {
      continue
    }
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
      case 'rerun':
        out.rerun = true
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

function getSelectedCases({
  runner,
  suite,
  testPattern,
}: {
  runner: 'claude-code' | 'llm'
  suite: Suite
  testPattern?: string
}): EvalCase[] {
  const runnableCases =
    runner === 'claude-code'
      ? suite.cases
      : suite.cases.filter((testCase) => testCase.category !== 'mcp')

  if (!testPattern) {
    return runnableCases
  }

  const pattern = new RegExp(testPattern)
  return runnableCases.filter(
    (testCase) => pattern.test(testCase.configPath) || pattern.test(testCase.input),
  )
}

async function findIdenticalCases({
  cases,
  model,
  runner,
  skill,
}: {
  cases: EvalCase[]
  model?: string
  runner: 'claude-code' | 'llm'
  skill: 'off' | 'on'
}): Promise<EvalCase[]> {
  const latestResultByParams = new Map(
    readRunResults()
      .sort((a, b) => a.result.runId.localeCompare(b.result.runId))
      .map((entry) => [entry.paramsHash, entry]),
  )
  const resolvedModelId = await getResolvedModelId({ model, runner })
  const skillInstall = runner === 'claude-code' ? (skill === 'on' ? 'embedded' : 'none') : undefined
  const systemPromptKey =
    runner === 'llm' ? (skill === 'on' ? 'codegenWithSkill' : 'codegenNoSkill') : undefined

  return cases.filter((testCase) => {
    const starterConfig = readFileSync(
      path.join(fixturesDir, testCase.configPath, 'payload.config.ts'),
      'utf8',
    )
    const paramsHash = codegenParamsHash({
      additionalAllowedTools: testCase.additionalAllowedTools,
      category: testCase.category,
      configPath: testCase.configPath,
      fixtureContent: starterConfig,
      input: testCase.input,
      modelId: resolvedModelId,
      runnerKind: runner,
      skillInstall,
      systemPromptKey,
      workspaceFiles: testCase.workspaceFiles,
    })
    return latestResultByParams.has(paramsHash)
  })
}

async function getResolvedModelId({
  model,
  runner,
}: {
  model?: string
  runner: 'claude-code' | 'llm'
}): Promise<string> {
  if (runner === 'claude-code') {
    return `claude-code/${model ?? 'claude-opus-4-6'}/${await getAgentVersion()}`
  }

  const { DEFAULT_RUNNER_MODEL, MODELS } = await import('./models.js')
  const runnerModel = model ? MODELS[model as keyof typeof MODELS] : DEFAULT_RUNNER_MODEL
  if (!runnerModel) {
    throw new Error(`Unknown model "${model}"`)
  }
  const details = runnerModel as { modelId?: string; provider?: string }
  return `${details.provider ?? 'unknown'}/${details.modelId ?? 'unknown'}`
}

async function chooseRunMode({ identicalCases }: { identicalCases: EvalCase[] }): Promise<boolean> {
  const caseLabel = identicalCases.length === 1 ? 'case' : 'cases'
  const shown = identicalCases.slice(0, 8).map((testCase) => `• ${testCase.input}`)
  if (identicalCases.length > shown.length) {
    shown.push(`• …and ${identicalCases.length - shown.length} more`)
  }

  p.note(
    shown.join('\n'),
    `${identicalCases.length} selected ${caseLabel} already ${identicalCases.length === 1 ? 'has' : 'have'} an identical result`,
  )
  return (
    (await pick(
      'How should this run proceed?',
      [
        {
          hint: 'reuse previous results and run the remaining cases',
          label: `Skip ${identicalCases.length} identical ${caseLabel}`,
          value: 'skip',
        },
        {
          hint: 'execute every selected case again',
          label: 'Rerun all selected cases',
          value: 'rerun',
        },
      ],
      'skip',
    )) === 'rerun'
  )
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USAGE + '\n')
    return
  }

  loadEnv()

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
  let rerun = args.rerun || process.env.EVAL_RERUN === 'true'

  if (!rerun) {
    const identicalCases = await findIdenticalCases({
      cases: getSelectedCases({ runner, suite, testPattern: args.testPattern }),
      model,
      runner,
      skill,
    })
    if (identicalCases.length > 0) {
      if (tty) {
        rerun = await chooseRunMode({ identicalCases })
      } else {
        process.stderr.write(
          `Warning: ${identicalCases.length} cases have identical completed results and will be skipped. Use --rerun to execute them.\n`,
        )
      }
    }
  }

  const vitestArgs = ['exec', 'vitest', '--run', '--project', 'eval']
  if (suite.spec) {
    vitestArgs.push(suite.spec)
  }
  if (args.testPattern) {
    vitestArgs.push('-t', args.testPattern)
  }

  // One id for this run; the dashboard groups results by it. We tag it "finished"
  // only on a clean exit below, so cancelled runs (Ctrl+C) stay hidden.
  const runId = new Date().toISOString()

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    EVAL_RUN_ID: runId,
    EVAL_RUNNER: runner,
    EVAL_SKILL: skill,
    NODE_NO_WARNINGS: '1',
    NODE_OPTIONS: '--no-deprecation --no-experimental-strip-types',
  }
  if (model) {
    env.EVAL_MODEL = model
  }
  if (rerun) {
    env.EVAL_RERUN = 'true'
  }

  if (tty) {
    p.outro(
      `▶ runner=${runner} · skill=${skill} · suite=${suiteValue}` +
        `${model ? ` · model=${model}` : ''}${rerun ? ' · rerun' : ''}` +
        `${args.testPattern ? ` · -t ${args.testPattern}` : ''}`,
    )
  }

  const child = spawn('pnpm', vitestArgs, { env, stdio: 'inherit' })
  child.on('error', (err) => {
    process.stderr.write(`Failed to launch vitest: ${err.message}\n`)
    process.exit(1)
  })
  child.on('exit', (code) => {
    // Numeric code (even 1 for test failures) = the run finished. A signal kill
    // (Ctrl+C) has code === null, so we don't tag it — the dashboard hides it.
    if (code !== null) {
      try {
        const runDir = path.join(runsDir, runId.replaceAll(':', '-'))
        mkdirSync(runDir, { recursive: true })
        writeFileSync(path.join(runDir, 'completed'), '', 'utf8')
      } catch (err) {
        // A finished run that isn't tagged gets hidden by the dashboard, so make
        // the failure loud instead of silently losing the run.
        process.stderr.write(
          `Warning: could not tag run ${runId} as finished — it will be hidden in the dashboard. ` +
            `${err instanceof Error ? err.message : String(err)}\n`,
        )
      }
    }
    process.exit(code ?? 1)
  })
}

main().catch((err: unknown) => {
  p.cancel(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
