import { execFile, spawn } from 'node:child_process'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { applyBumps } from '../apply-bumps.mjs'
import { classifyFixes } from '../bumps.mjs'
import { findDisallowedChanges, listWorkingTreeChanges } from '../path-guard.mjs'
import { bumpsOfPr, readPlan } from '../plan.mjs'
import { readReport } from '../report.mjs'
import { isPreparedStep, parsePrSteps, writePrepared } from '../step-handoff.mjs'
import { buildPr } from './pr.mjs'
import { errorMessage, requireOption, toSummaryText, writeSummary } from './shared.mjs'

const execFileAsync = promisify(execFile)

// The audit bundle comes from the same checkout as these scripts, so the re-audit runs the same
// code as the first audit.
const AUDIT_ACTION_ENTRY = fileURLToPath(
  new URL('../../../actions/audit-dependencies/dist/index.js', import.meta.url),
)
const BOT_IDENTITY = {
  GIT_AUTHOR_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com',
  GIT_AUTHOR_NAME: 'github-actions[bot]',
  GIT_COMMITTER_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com',
  GIT_COMMITTER_NAME: 'github-actions[bot]',
}

/**
 * Usage: `prepare-prs --plan --pr-steps-json --ref --scope --severity --run-url --cwd --out-dir`.
 * For each PR whose step is create, update or dry-run, it applies the bumps on the base commit,
 * regenerates the lockfile without install scripts, checks the changed paths, runs the audit
 * again, renders the PR body and commits on the PR branch. Writes `<out-dir>/prepared.json` with
 * one record for each planned PR. When one PR fails, its record names the step that failed and
 * the other PRs continue. `run` spawns pnpm and the audit, and `renderPr` builds the title and
 * body.
 */
export async function runPreparePrs({ options, run = spawnForExitCode, renderPr = buildPr }) {
  const plan = await readPlan({ path: requireOption({ name: 'plan', options }) })
  const prSteps = parsePrSteps({ plan, text: requireOption({ name: 'pr-steps-json', options }) })
  const cwd = requireOption({ name: 'cwd', options })
  const outDir = requireOption({ name: 'out-dir', options })
  const context = {
    cwd,
    outDir,
    plan,
    ref: requireOption({ name: 'ref', options }),
    renderPr,
    run,
    runUrl: requireOption({ name: 'run-url', options }),
    scope: requireOption({ name: 'scope', options }),
    severity: requireOption({ name: 'severity', options }),
  }
  // Each PR starts with a forced checkout and `git clean`, which delete uncommitted work.
  if ((await git({ args: ['status', '--porcelain'], cwd })) !== '') {
    throw new Error(`prepare-prs needs a clean working tree in ${cwd}`)
  }
  await mkdir(outDir, { recursive: true })
  const baseSha = await git({ args: ['rev-parse', 'HEAD'], cwd })
  // With the base commit date, the same base and changes give the same commit on every run. A
  // rerun then pushes nothing new and starts no CI run.
  const baseDate = await git({ args: ['log', '-1', '--format=%cI', baseSha], cwd })
  const commitEnv = { ...BOT_IDENTITY, GIT_AUTHOR_DATE: baseDate, GIT_COMMITTER_DATE: baseDate }

  const prepared = []
  for (const pr of plan.prs) {
    const prStep = prSteps[pr.id]
    const entry = {
      branch: pr.branch,
      headSha: prStep.headSha,
      prId: pr.id,
      prNumber: prStep.prNumber,
      step: prStep.step,
    }
    prepared.push(
      isPreparedStep({ step: prStep.step })
        ? await preparePr({ baseSha, commitEnv, context, entry, pr })
        : entry,
    )
  }
  await git({ args: ['checkout', '-q', '--force', '--detach', baseSha], cwd })

  await writePrepared({ file: path.join(outDir, 'prepared.json'), prs: prepared })
  await writeSummary({ markdown: renderPreparedSummary({ prepared, ref: context.ref }) })
}

async function preparePr({ baseSha, commitEnv, context, entry, pr }) {
  if (!isValidPrBranch({ branch: pr.branch, ref: context.ref })) {
    return { ...entry, failedStep: 'branch', reason: 'not a ci/audit-deps-fix branch' }
  }

  const { cwd } = context
  let currentStep = 'checkout'
  try {
    await git({ args: ['checkout', '-q', '--force', '-B', pr.branch, baseSha], cwd })
    await git({ args: ['clean', '-fdq'], cwd })
    // `git clean -fd` leaves ignored files, and the change list includes them. Recording them
    // here lets the path guard check only the changes that this PR makes.
    const baseline = await listWorkingTreeChanges({ cwd })

    currentStep = 'apply'
    const bumps = bumpsOfPr({ plan: context.plan, pr })
    await applyBumps({ bumps, cwd })

    currentStep = 'lockfile'
    await runOrThrow({
      args: ['install', '--lockfile-only', '--ignore-scripts'],
      command: 'pnpm',
      cwd,
      run: context.run,
    })

    currentStep = 'path-guard'
    const changes = listNewChanges({ baseline, changes: await listWorkingTreeChanges({ cwd }) })
    const disallowed = findDisallowedChanges({ changes })
    if (disallowed.length > 0) {
      throw new Error(disallowed.join('; '))
    }

    currentStep = 're-audit'
    const reaudit = await reauditPr({ context, pr })
    const uncleared = findUnclearedAdvisories({ bumps, report: reaudit })
    if (uncleared.length > 0) {
      throw new Error(`still reported through the bumped dependency: ${uncleared.join(', ')}`)
    }

    currentStep = 'body'
    const { body, isDraft, title } = await context.renderPr({
      cwd,
      plan: context.plan,
      prId: pr.id,
      reaudit,
      ref: context.ref,
      runUrl: context.runUrl,
      scope: context.scope,
      severity: context.severity,
    })
    const bodyFile = path.join(context.outDir, `${pr.id}.md`)
    await writeFile(bodyFile, body)

    currentStep = 'commit'
    await git({ args: ['add', '-u'], cwd })
    await git({
      args: ['-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', title],
      cwd,
      env: commitEnv,
    })
    const commit = await git({ args: ['rev-parse', 'HEAD'], cwd })

    return { ...entry, bodyFile, commit, isDraft, title }
  } catch (error) {
    const reason = toSummaryText({ text: errorMessage({ error }) })
    return { ...entry, failedStep: currentStep, reason }
  }
}

async function reauditPr({ context, pr }) {
  const file = path.join(context.outDir, `reaudit-${pr.id}.json`)
  await rm(file, { force: true })

  const code = await context.run({
    args: [AUDIT_ACTION_ENTRY],
    command: 'node',
    cwd: context.cwd,
    env: { INPUT_JSON: file, INPUT_SCOPE: context.scope, INPUT_SEVERITY: context.severity },
  })
  const size = await stat(file).then(
    (info) => info.size,
    () => 0,
  )
  // A non-zero exit means the re-audit may be incomplete, so it cannot show that a fix works.
  if (code !== 0 || size === 0) {
    throw new Error(`re-audit exited ${code}`)
  }

  return readReport({ path: file })
}

function listNewChanges({ baseline, changes }) {
  const keyOf = ({ isSymlink, path, status }) => `${status}\0${path}\0${isSymlink}`
  const before = new Set(baseline.map(keyOf))

  return changes.filter((change) => !before.has(keyOf(change)))
}

// Returns the advisories that the re-audit reports through a dependency this PR bumps. A PR with
// such an advisory would claim a fix that it does not make.
function findUnclearedAdvisories({ bumps, report }) {
  const { fixed, partly } = classifyFixes({ bumps, report })
  const cleared = new Set([...fixed, ...partly])

  return [...new Set(bumps.flatMap((bump) => bump.advisories))]
    .filter((advisory) => !cleared.has(advisory))
    .sort()
}

function renderPreparedSummary({ prepared, ref }) {
  const built = prepared.filter((entry) => isPreparedStep({ step: entry.step }))
  const lines = [`## Prepared PRs (${ref})`, '']
  if (built.length === 0) {
    lines.push('No PR to create or update.')
  }
  for (const entry of built) {
    const name = toSummaryText({ text: entry.prId, maxLength: 200 })
    lines.push(
      entry.failedStep
        ? `- ${name}: failed at ${entry.failedStep}: ${entry.reason}`
        : `- ${name}: ${entry.step}${entry.isDraft ? ' (draft)' : ''}: ${toSummaryText({ text: entry.title })}`,
    )
  }
  return lines.join('\n')
}

function isValidPrBranch({ branch, ref }) {
  return (
    typeof branch === 'string' &&
    branch.startsWith(`ci/audit-deps-fix-${ref}-`) &&
    /^[A-Za-z0-9._/-]+$/.test(branch)
  )
}

async function git({ args, cwd, env = {} }) {
  const { stdout } = await execFileAsync('git', args, { cwd, env: { ...process.env, ...env } })
  return stdout.trim()
}

async function runOrThrow({ args, command, cwd, run }) {
  const code = await run({ args, command, cwd })
  if (code !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${code}`)
  }
}

// pnpm and the re-audit need only registry data, so they run without `GITHUB_TOKEN`.
export function spawnForExitCode({ args, command, cwd, env = {} }) {
  const { GITHUB_TOKEN: _token, ...inherited } = process.env

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...inherited, ...env }, stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', (code, signal) => resolve(signal ? 128 : (code ?? 255)))
  })
}
