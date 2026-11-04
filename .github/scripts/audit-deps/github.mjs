import {
  decidePrStep,
  findStalePrs,
  fingerprintForPr,
  hasForeignCommits,
  parseFingerprint,
} from './decide.mjs'
import { bumpsOfPr } from './plan.mjs'
import { formatStepOutputs } from './step-handoff.mjs'

const BRANCH_PREFIX = 'ci/audit-deps-fix-'
const MISSING_REF_STATUSES = new Set([404, 422])
const CLOSED_PRS_PER_BRANCH = 20
const MAX_CLOSER_LOOKUPS = 5
const MERGEABILITY_ATTEMPTS = 3
const MERGEABILITY_RETRY_MS = 3000
const COMMENT_TAG = '<!-- audit-deps-comment -->'
const STALE_COMMENT = 'The audit no longer needs this update.'
const STALE_KEPT_BRANCH_COMMENT =
  'The audit no longer needs this update. The branch has commits from a person, so it was not deleted.'

/**
 * Decides the step for each planned PR and sets the step outputs `pr_steps` and `stale_prs` as
 * single-line JSON. A dry run (non-default inputs) makes no GitHub API calls.
 */
export async function decidePrSteps({ core, github, isDefaultInputs, owner, plan, ref, repo }) {
  if (!isDefaultInputs) {
    return setOutputs({
      core,
      plan,
      prSteps: Object.fromEntries(
        plan.prs.map((pr) => [pr.id, { headSha: null, prNumber: null, step: 'dry-run' }]),
      ),
      staleNumbers: [],
    })
  }

  const openPrs = await listOpenBotPrs({ github, owner, ref, repo })
  const stepsById = new Map()

  for (const pr of plan.prs) {
    const prStep = await decideStepForPr({
      github,
      openPr: openPrs.find((openPr) => openPr.branch === pr.branch) ?? null,
      owner,
      plan,
      pr,
      ref,
      repo,
    })
    stepsById.set(pr.id, prStep)
  }

  return setOutputs({
    core,
    plan,
    prSteps: Object.fromEntries(plan.prs.map((pr) => [pr.id, stepsById.get(pr.id)])),
    staleNumbers: findStalePrs({ openPrs, prs: plan.prs, ref }),
  })
}

/**
 * Closes stale audit PRs with a comment and deletes their branches. A branch with commits from a
 * person is not deleted, so their work is not lost.
 */
export async function closeStalePrs({ github, owner, prNumbers, ref, repo }) {
  for (const prNumber of prNumbers) {
    try {
      await closeStalePr({ github, owner, prNumber, ref, repo })
    } catch (error) {
      console.error(`Failed to close stale audit PR #${prNumber}: ${error?.message ?? error}`)
      throw error
    }
  }
}

async function closeStalePr({ github, owner, prNumber, ref, repo }) {
  const { data: pr } = await github.rest.pulls.get({ owner, pull_number: prNumber, repo })
  const branch = pr.head.ref
  const isOurs = isBotPr({ owner, pr, ref, repo })
  if (!isOurs || pr.state !== 'open') {
    return
  }

  const hasPersonCommits = hasForeignCommits({
    commits: await listCommits({ github, owner, prNumber, repo }),
  })

  // A prior run can comment and then fail to close, so a rerun does not comment twice.
  if (!(await hasBotComment({ github, owner, prNumber, repo }))) {
    await github.rest.issues.createComment({
      body: withCommentTag({ text: hasPersonCommits ? STALE_KEPT_BRANCH_COMMENT : STALE_COMMENT }),
      issue_number: prNumber,
      owner,
      repo,
    })
  }
  await github.rest.pulls.update({ owner, pull_number: prNumber, repo, state: 'closed' })

  if (!hasPersonCommits) {
    await deleteBranch({ branch, github, owner, repo })
  }
}

function isBotPr({ owner, pr, ref, repo }) {
  return (
    pr.head.ref.startsWith(`${BRANCH_PREFIX}${ref}-`) &&
    pr.head.repo?.full_name === `${owner}/${repo}` &&
    pr.user?.type === 'Bot'
  )
}

async function hasBotComment({ github, owner, prNumber, repo }) {
  const comments = await github.paginate(github.rest.issues.listComments, {
    issue_number: prNumber,
    owner,
    per_page: 100,
    repo,
  })

  return comments.some(
    (comment) => comment.user?.type === 'Bot' && comment.body?.includes(COMMENT_TAG),
  )
}

function withCommentTag({ text }) {
  return `${text}\n\n${COMMENT_TAG}`
}

function setOutputs({ core, plan, prSteps, staleNumbers }) {
  for (const [name, value] of Object.entries(
    formatStepOutputs({ plan, prSteps, stalePrs: staleNumbers }),
  )) {
    core.setOutput(name, value)
  }
}

async function decideStepForPr({ github, openPr, owner, plan, pr, ref, repo }) {
  const prNumber = openPr?.number ?? null
  const headSha = openPr?.headSha ?? null
  const fingerprint = fingerprintForPr({ bumps: bumpsOfPr({ plan, pr }), pr })
  if (!openPr) {
    const rejectedPr = await findRejectedPr({ github, owner, pr, ref, repo })
    const step = decidePrStep({ fingerprint, openPr: null, rejectedPr })

    return decideLeftoverBranch({ branch: pr.branch, github, owner, ref, repo, step })
  }

  let openState = { fingerprint: parseFingerprint({ body: openPr.body }), hasForeignCommits: false }
  let step = decidePrStep({ fingerprint, openPr: openState, rejectedPr: null })
  if (step === 'skip' && (await isConflicted({ github, owner, prNumber, repo }))) {
    openState = { ...openState, isConflicted: true }
    step = decidePrStep({ fingerprint, openPr: openState, rejectedPr: null })
  }
  if (step === 'update') {
    const commits = await listCommits({ github, owner, prNumber, repo })
    step = decidePrStep({
      fingerprint,
      openPr: { ...openState, hasForeignCommits: hasForeignCommits({ commits }) },
      rejectedPr: null,
    })
  }

  return { headSha, prNumber, step }
}

/**
 * A branch can exist without an open PR, for example after a close or merge that did not delete
 * it, or after a failed PR create. Returns its head for the push lease, and blocks the step when
 * the branch has commits from a person, so the bot does not overwrite them.
 */
async function decideLeftoverBranch({ branch, github, owner, ref, repo, step }) {
  const headSha = await findBranchSha({ branch, github, owner, repo })
  if (!headSha) {
    return { headSha: null, prNumber: null, step }
  }

  const { data } = await github.rest.repos.compareCommits({ base: ref, head: branch, owner, repo })
  const isBlocked = hasForeignCommits({ commits: data.commits })

  return { headSha, prNumber: null, step: isBlocked ? 'blocked' : step }
}

async function findBranchSha({ branch, github, owner, repo }) {
  try {
    const { data } = await github.rest.git.getRef({ owner, ref: `heads/${branch}`, repo })
    return data.object.sha
  } catch (error) {
    if (error?.status === 404) {
      return null
    }
    throw error
  }
}

async function listOpenBotPrs({ github, owner, ref, repo }) {
  const prs = await github.paginate(github.rest.pulls.list, {
    base: ref,
    owner,
    per_page: 100,
    repo,
    state: 'open',
  })

  return prs
    .filter((pr) => isBotPr({ owner, pr, ref, repo }))
    .map((pr) => ({
      body: pr.body,
      branch: pr.head.ref,
      headSha: pr.head.sha ?? null,
      number: pr.number,
    }))
}

/**
 * Finds the latest bot PR on this branch that a person closed without a merge and whose body has
 * a fingerprint. A PR closed by a bot or by an unknown user is not a rejection, because a missed
 * security fix costs more than a duplicate PR.
 */
async function findRejectedPr({ github, owner, pr: plannedPr, ref, repo }) {
  const { data } = await github.rest.pulls.list({
    direction: 'desc',
    head: `${owner}:${plannedPr.branch}`,
    owner,
    per_page: CLOSED_PRS_PER_BRANCH,
    repo,
    sort: 'updated',
    state: 'closed',
  })
  const candidates = data
    .filter((pr) => pr.merged_at === null && pr.closed_at && isBotPr({ owner, pr, ref, repo }))
    .sort((a, b) => Date.parse(b.closed_at) - Date.parse(a.closed_at))
    .map((pr) => ({ fingerprint: parseFingerprint({ body: pr.body }), number: pr.number }))
    .filter((pr) => pr.fingerprint !== null)
    .slice(0, MAX_CLOSER_LOOKUPS)

  for (const candidate of candidates) {
    const { data: issue } = await github.rest.issues.get({
      issue_number: candidate.number,
      owner,
      repo,
    })
    if (issue.closed_by && issue.closed_by.type !== 'Bot') {
      return { fingerprint: candidate.fingerprint }
    }
  }

  return null
}

// GitHub computes mergeability in the background and reports `unknown` until it is done, so an
// `unknown` answer is asked again. Only `dirty` counts as a conflict.
async function isConflicted({ github, owner, prNumber, repo }) {
  for (let attempt = 1; ; attempt++) {
    const { data: pr } = await github.rest.pulls.get({ owner, pull_number: prNumber, repo })
    if (pr?.mergeable_state !== 'unknown' || attempt === MERGEABILITY_ATTEMPTS) {
      return pr?.mergeable_state === 'dirty'
    }
    await new Promise((resolve) => setTimeout(resolve, MERGEABILITY_RETRY_MS))
  }
}

function listCommits({ github, owner, prNumber, repo }) {
  return github.paginate(github.rest.pulls.listCommits, {
    owner,
    per_page: 100,
    pull_number: prNumber,
    repo,
  })
}

async function deleteBranch({ branch, github, owner, repo }) {
  try {
    await github.rest.git.deleteRef({ owner, ref: `heads/${branch}`, repo })
  } catch (error) {
    if (!MISSING_REF_STATUSES.has(error?.status)) {
      throw error
    }
  }
}
