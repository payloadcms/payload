import { decideNextStep, hasForeignCommits } from './decide.mjs'
import { parseAdvisoryMarker } from './report.mjs'

const BRANCH_PREFIX = 'ci/audit-deps-fix-'
const MISSING_REF_STATUSES = new Set([404, 422])

/**
 * Looks up the bot PR for `ref` and sets the `next_step` and `pr_number` outputs.
 * Non-default inputs never touch PRs.
 */
export async function runPrecheck({ core, fixable, github, isDefaultInputs, owner, ref, repo }) {
  if (!isDefaultInputs) {
    return setOutputs({
      core,
      nextStep: decideNextStep({ fixable, isDefaultInputs, openPr: null, rejectedPr: null }),
      prNumber: '',
    })
  }

  const openPr = await findOpenPr({ github, owner, ref, repo })
  const rejectedPr = openPr ? null : await findRejectedPr({ fixable, github, owner, ref, repo })

  return setOutputs({
    core,
    nextStep: decideNextStep({
      fixable,
      isDefaultInputs,
      openPr: openPr?.summary ?? null,
      rejectedPr,
    }),
    prNumber: openPr ? String(openPr.number) : '',
  })
}

export async function closeStalePr({ github, owner, prNumber, ref, repo }) {
  await github.rest.issues.createComment({
    body: `Base branch \`${ref}\` has no fixable findings; closing.`,
    issue_number: prNumber,
    owner,
    repo,
  })
  await github.rest.pulls.update({ owner, pull_number: prNumber, repo, state: 'closed' })

  try {
    await github.rest.git.deleteRef({ owner, ref: `heads/${BRANCH_PREFIX}${ref}`, repo })
  } catch (error) {
    if (!MISSING_REF_STATUSES.has(error?.status)) {
      throw error
    }
  }
}

export async function commentBlocked({ fixable, github, owner, prNumber, repo }) {
  const marker = `<!-- audit-deps-blocked: ${[...new Set(fixable)].sort().join(',')} -->`

  const comments = await github.paginate(github.rest.issues.listComments, {
    issue_number: prNumber,
    owner,
    per_page: 100,
    repo,
  })
  if (comments.some((comment) => comment.body?.includes(marker))) {
    return
  }

  await github.rest.issues.createComment({
    body:
      'The audit found a different set of fixable advisories, but this branch has commits from a person, ' +
      'so it was not updated. Rebase or close this PR to let automation continue.\n\n' +
      marker,
    issue_number: prNumber,
    owner,
    repo,
  })
}

function setOutputs({ core, nextStep, prNumber }) {
  core.setOutput('next_step', nextStep)
  core.setOutput('pr_number', prNumber)
}

async function findOpenPr({ github, owner, ref, repo }) {
  const { data } = await github.rest.pulls.list({
    base: ref,
    head: `${owner}:${BRANCH_PREFIX}${ref}`,
    owner,
    repo,
    state: 'open',
  })
  const pr = data[0]
  if (!pr) {
    return null
  }

  const commits = await github.paginate(github.rest.pulls.listCommits, {
    owner,
    per_page: 100,
    pull_number: pr.number,
    repo,
  })

  return {
    number: pr.number,
    summary: {
      advisories: parseAdvisoryMarker({ body: pr.body }),
      hasForeignCommits: hasForeignCommits({ commits }),
    },
  }
}

/**
 * Only a person closing an unmerged PR counts as a rejection. Bot closes and unknown
 * closers do not, because a missed security PR costs more than a duplicate.
 */
async function findRejectedPr({ fixable, github, owner, ref, repo }) {
  if (fixable.length === 0) {
    return null
  }

  const { data } = await github.rest.pulls.list({
    base: ref,
    direction: 'desc',
    head: `${owner}:${BRANCH_PREFIX}${ref}`,
    owner,
    per_page: 1,
    repo,
    sort: 'updated',
    state: 'closed',
  })
  const pr = data[0]
  if (!pr || pr.merged_at) {
    return null
  }

  const { data: issue } = await github.rest.issues.get({
    issue_number: pr.number,
    owner,
    repo,
  })
  if (issue.closed_by?.type !== 'User') {
    return null
  }

  return { advisories: parseAdvisoryMarker({ body: pr.body }) }
}
