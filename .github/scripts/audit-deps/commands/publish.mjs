import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { closeStalePrs } from '../github.mjs'
import { isPreparedStep, parseStalePrs, readPrepared } from '../step-handoff.mjs'
import { errorMessage, toSummaryText } from './shared.mjs'

const execFileAsync = promisify(execFile)

const UNPREPARED_REASONS = {
  blocked: 'a person pushed to this branch; the bot no longer updates it',
  skip: 'unchanged since the last run',
  'skip-rejected': 'a person closed this change; it is not re-created',
}

/**
 * Runs the `Publish PRs` workflow step from actions/github-script, after `prepare-prs`. Reads
 * `APP_TOKEN`, `IS_DEFAULT_INPUTS`, `PREPARED_FILE`, `REF`, `STALE_PRS` and `GITHUB_WORKSPACE`
 * from `env`. A real run (from main, with default inputs) pushes each prepared commit, creates or
 * updates its PR, then closes stale PRs. A dry run only writes the summary. The summary lists
 * every planned PR. When a PR fails, the other PRs continue and the step fails at the end.
 */
export async function runPublish({ context, core, env, github, push = pushBranch }) {
  const { owner, repo } = context.repo
  const ref = env.REF
  const isRealRun = env.IS_DEFAULT_INPUTS === 'true'
  const staleNumbers = parseStalePrs({ text: env.STALE_PRS })
  const prepared = await readPrepared({ file: env.PREPARED_FILE })

  const isTokenMissing = isRealRun && !env.APP_TOKEN
  const results = []
  for (const entry of prepared) {
    if (entry.failedStep) {
      results.push({
        entry,
        status: 'failed',
        reason: `failed at ${entry.failedStep}: ${entry.reason}`,
      })
      continue
    }
    if (!isPreparedStep({ step: entry.step })) {
      results.push({
        entry,
        number: entry.prNumber,
        reason: UNPREPARED_REASONS[entry.step],
        status: entry.step,
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

// The lease expects the branch head that `Decide PR steps` saw, or no branch for a new PR. If a
// person pushes in between, the push fails and their commits stay on the branch.
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
  // The runner masks the raw token but not its base64 form, and git trace output can print it.
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
      // Git reads this config from env, which keeps the token out of the visible process arguments.
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
    await github.rest.pulls.update({
      body,
      owner,
      pull_number: entry.prNumber,
      repo,
      title: entry.title,
    })
    return entry.prNumber
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
