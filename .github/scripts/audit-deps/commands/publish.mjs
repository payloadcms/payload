import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { closeStalePrs } from '../github.mjs'
import { errorMessage, toSummaryText } from './shared.mjs'

const execFileAsync = promisify(execFile)

const UNPREPARED_REASONS = {
  blocked: 'a person pushed to this branch; the bot no longer updates it',
  skip: 'unchanged since the last run',
  'skip-rejected': 'a person closed this change; it is not re-created',
}

/**
 * github-script step after `prepare-prs`. Reads `APP_TOKEN`, `IS_DEFAULT_INPUTS`, `PR_STEPS`,
 * `REF`, `STALE_PRS`, `RUNNER_TEMP`, `GITHUB_WORKSPACE`. Real runs push each prepared commit
 * and create or update its PR, then close stale PRs; dry runs only report. The summary lists
 * every planned PR. Any failed PR fails the step after every other PR is handled.
 */
export async function runPublish({ context, core, env, github, push = pushBranch }) {
  const { owner, repo } = context.repo
  const ref = env.REF
  const isRealRun = env.IS_DEFAULT_INPUTS === 'true'
  const staleNumbers = parseStalePrs({ text: env.STALE_PRS })
  const prepared = JSON.parse(
    await readFile(path.join(env.RUNNER_TEMP, 'prepared', 'prepared.json'), 'utf8'),
  )

  const isTokenMissing = isRealRun && !env.APP_TOKEN
  const results = []
  for (const entry of prepared.prs) {
    if (entry.failedStep) {
      results.push({
        entry,
        status: 'failed',
        reason: `failed at ${entry.failedStep}: ${entry.reason}`,
      })
      continue
    }
    if (!isRealRun) {
      results.push({ entry, status: 'dry-run' })
      continue
    }
    if (isTokenMissing) {
      results.push({ entry, status: 'not-published', reason: 'App token missing' })
      continue
    }

    try {
      await push({ core, cwd: env.GITHUB_WORKSPACE, entry, owner, repo, token: env.APP_TOKEN })
      const number = await upsertPr({ entry, github, owner, ref, repo })
      results.push({ entry, number, status: entry.step === 'update' ? 'updated' : 'created' })
    } catch (error) {
      results.push({ entry, status: 'failed', reason: errorMessage({ error }) })
    }
  }

  const preparedIds = new Set(prepared.prs.map((entry) => entry.prId))
  for (const [prId, prStep] of Object.entries(JSON.parse(env.PR_STEPS || '{}'))) {
    if (!preparedIds.has(prId)) {
      results.push({
        entry: { prId },
        number: prStep.prNumber,
        reason: UNPREPARED_REASONS[prStep.step],
        status: prStep.step,
      })
    }
  }

  if (isRealRun && !isTokenMissing) {
    for (const prNumber of staleNumbers) {
      try {
        await closeStalePrs({ github, owner, prNumbers: [prNumber], ref, repo })
      } catch (error) {
        results.push({
          entry: { prId: 'stale' },
          number: prNumber,
          reason: errorMessage({ error }),
          status: 'failed',
        })
      }
    }
  }

  await core.summary.addRaw(renderResults({ ref, results })).write()
  if (isTokenMissing) {
    core.setFailed('App token missing; no PRs were published')
    return
  }
  if (results.some((result) => result.status === 'failed')) {
    core.setFailed(`Some audit PRs for ${ref} were not opened or updated; see the run summary`)
  }
}

// The lease names the head the plan saw (none for a new branch), so a person's push is not overwritten.
export async function pushBranch({
  core,
  cwd,
  entry,
  execFile = execFileAsync,
  owner,
  repo,
  token,
}) {
  const lease = `refs/heads/${entry.branch}:${entry.headSha ?? ''}`
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64')
  // The runner masks the token but not its base64 form, which git trace output can print.
  core.setSecret(basic)

  await execFile(
    'git',
    [
      '-c',
      'core.hooksPath=/dev/null',
      'push',
      '--quiet',
      `--force-with-lease=${lease}`,
      `https://github.com/${owner}/${repo}.git`,
      `${entry.commit}:refs/heads/${entry.branch}`,
    ],
    {
      cwd,
      // Config through env keeps the token out of the process arguments.
      env: {
        ...process.env,
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
      },
    },
  )
}

async function upsertPr({ entry, github, owner, ref, repo }) {
  const body = await readFile(entry.bodyFile, 'utf8')

  if (entry.step === 'update') {
    const number = Number(entry.prNumber ?? (await findPrNumber({ entry, github, owner, repo })))
    await github.rest.pulls.update({ body, owner, pull_number: number, repo, title: entry.title })
    return number
  }

  const { data } = await github.rest.pulls.create({
    base: ref,
    body,
    draft: entry.isDraft,
    head: entry.branch,
    owner,
    repo,
    title: entry.title,
  })
  await github.rest.issues.addLabels({
    issue_number: data.number,
    labels: ['dependencies'],
    owner,
    repo,
  })
  return data.number
}

async function findPrNumber({ entry, github, owner, repo }) {
  const { data } = await github.rest.pulls.list({
    head: `${owner}:${entry.branch}`,
    owner,
    repo,
    state: 'open',
  })
  if (!data[0]) {
    throw new Error(`no open PR for ${entry.branch}`)
  }
  return data[0].number
}

function parseStalePrs({ text }) {
  const prNumbers = JSON.parse(text || '[]')
  if (!Array.isArray(prNumbers) || !prNumbers.every((n) => Number.isInteger(n) && n > 0)) {
    throw new Error(`invalid stale PR numbers: ${text}`)
  }
  return prNumbers
}

function renderResults({ ref, results }) {
  const lines = [`## Audit PRs (${ref})`, '']
  if (results.length === 0) {
    lines.push('Nothing to open or update.')
  }
  for (const { entry, number, reason, status } of results) {
    const name = toSummaryText({ text: entry.prId, maxLength: 200 })
    const link = number ? ` #${number}` : ''
    const detail = reason ? `: ${toSummaryText({ text: reason })}` : ''
    lines.push(`- ${name}: ${status}${link}${detail}`)
  }
  return `${lines.join('\n')}\n`
}
