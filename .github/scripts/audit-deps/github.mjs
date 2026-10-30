import {
  decideUnitStep,
  findStalePrs,
  hasForeignCommits,
  markerForUnit,
  parseMarker,
} from './decide.mjs'

const BRANCH_PREFIX = 'ci/audit-deps-fix-'
const MISSING_REF_STATUSES = new Set([404, 422])
const INACTIVE_STEPS = new Set(['skip', 'skip-rejected', 'blocked'])
const CLOSED_PRS_PER_UNIT = 20
const MAX_CLOSER_LOOKUPS = 5
const COMMENT_MARKER = '<!-- audit-deps-comment -->'
const STALE_COMMENT = 'The audit no longer needs this update.'
const STALE_KEPT_BRANCH_COMMENT =
  'The audit no longer needs this update. The branch has commits from a person, so it was not deleted.'
const BLOCKED_COMMENT =
  'The audit found a different set of updates, but this branch has commits from a person, so it was not updated.'

/**
 * @typedef {import('./bumps.mjs').Bump} Bump
 * @typedef {import('./bumps.mjs').Unit} Unit
 * @typedef {import('./decide.mjs').UnitStep} UnitStep
 * @typedef {Record<string, { step: UnitStep, prNumber: number | null, headSha: string | null }>} UnitSteps
 */

/**
 * Decides every unit's step and sets the job outputs: `unit_steps`, `research_matrix`,
 * `verify_matrix`, `open_pr_matrix`, `stale_prs` (all single-line JSON). Non-default inputs
 * never call the API.
 */
export async function runPrecheck({ core, github, isDefaultInputs, owner, plan, ref, repo }) {
  if (!isDefaultInputs) {
    return setOutputs({
      core,
      plan,
      staleNumbers: [],
      unitSteps: Object.fromEntries(
        plan.units.map((unit) => [unit.id, { headSha: null, prNumber: null, step: 'dry-run' }]),
      ),
    })
  }

  const openPrs = await listOpenBotPrs({ github, owner, ref, repo })
  const unitSteps = {}

  for (const unit of plan.units) {
    unitSteps[unit.id] = await decideStepForUnit({
      github,
      openPr: openPrs.find((pr) => pr.branch === unit.branch) ?? null,
      owner,
      plan,
      ref,
      repo,
      unit,
    })
  }

  return setOutputs({
    core,
    plan,
    staleNumbers: findStalePrs({ openPrs, ref, units: plan.units }),
    unitSteps,
  })
}

/**
 * Closes PRs no unit owns anymore. A branch with a person's commits is kept so their
 * work survives.
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

/**
 * Closes stale PRs and comments on failed units. A failure in one does not stop the other;
 * the errors are thrown together after both ran.
 */
export async function runHousekeeping({
  github,
  outcomes,
  owner,
  prNumbers,
  ref,
  repo,
  unitSteps,
}) {
  const tasks = [
    () => closeStalePrs({ github, owner, prNumbers, ref, repo }),
    () => commentOnFailedUnits({ github, outcomes, owner, repo, unitSteps }),
  ]
  const errors = []
  for (const task of tasks) {
    try {
      await task()
    } catch (error) {
      errors.push(error)
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, errors.map((error) => error?.message ?? error).join('; '))
  }
}

/**
 * True while the PR head is still `headSha`, so a person's push after the precheck is
 * never overwritten.
 */
export async function checkHeadUnchanged({ github, headSha, owner, prNumber, repo }) {
  try {
    const { data: pr } = await github.rest.pulls.get({ owner, pull_number: prNumber, repo })

    return pr.head.sha === headSha
  } catch (error) {
    console.log(
      `::warning::Could not read head of audit PR #${prNumber}: ${error?.message ?? error}`,
    )
    return false
  }
}

/**
 * Ids of artifacts named `<artifactPrefix><id>` that the latest job leg `jobNameFor(id)` up to
 * this run attempt uploaded. A job that runs package scripts can upload under any name first, so
 * an artifact counts only when that leg succeeded, the artifact was created while the leg ran,
 * and it is the only one that was. Every other id is left out with a warning.
 * @returns {Promise<Record<string, number>>}
 */
export async function findSealedArtifacts({
  artifactPrefix,
  github,
  jobNameFor,
  owner,
  repo,
  runAttempt,
  runId,
}) {
  const [artifacts, jobs] = await Promise.all([
    github.paginate(github.rest.actions.listWorkflowRunArtifacts, {
      owner,
      per_page: 100,
      repo,
      run_id: runId,
    }),
    github.paginate(github.rest.actions.listJobsForWorkflowRun, {
      filter: 'latest',
      owner,
      per_page: 100,
      repo,
      run_id: runId,
    }),
  ])

  const artifactsById = new Map()
  for (const artifact of artifacts) {
    if (artifact.expired || !artifact.name.startsWith(artifactPrefix)) {
      continue
    }
    const id = artifact.name.slice(artifactPrefix.length)
    artifactsById.set(id, [...(artifactsById.get(id) ?? []), artifact])
  }

  const sealed = {}
  for (const [id, candidates] of artifactsById) {
    const leg = findSuccessfulLeg({ jobName: jobNameFor(id), jobs, runAttempt })
    const uploaded = leg ? candidates.filter((artifact) => isWithinLeg({ artifact, leg })) : []
    if (uploaded.length !== 1) {
      console.log(
        `::warning::Ignoring artifact ${escapeCommandText({ text: `${artifactPrefix}${id}` })}: not uploaded by its leg`,
      )
      continue
    }
    sealed[id] = uploaded[0].id
  }

  return sealed
}

// Jobs of a reusable workflow are listed as `<caller job> / <job>`. Re-running failed jobs keeps
// the successful legs of an earlier attempt, so those legs count too.
function findSuccessfulLeg({ jobName, jobs, runAttempt }) {
  const legs = jobs.filter(
    (job) =>
      job.run_attempt <= runAttempt &&
      (job.name === jobName || job.name?.endsWith(` / ${jobName}`)),
  )

  return legs.length === 1 && legs[0].conclusion === 'success' ? legs[0] : null
}

function isWithinLeg({ artifact, leg }) {
  const createdAt = Date.parse(artifact.created_at)

  return createdAt >= Date.parse(leg.started_at) && createdAt <= Date.parse(leg.completed_at)
}

function escapeCommandText({ text }) {
  return text.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
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

  await github.rest.issues.createComment({
    body: withCommentMarker({ text: hasPersonCommits ? STALE_KEPT_BRANCH_COMMENT : STALE_COMMENT }),
    issue_number: prNumber,
    owner,
    repo,
  })
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

function withCommentMarker({ text }) {
  return `${text}\n\n${COMMENT_MARKER}`
}

/**
 * Comments once per state change on open PRs whose unit failed today or is blocked.
 * `outcomes` maps unit id to an already sanitized reason.
 */
export async function commentOnFailedUnits({ github, owner, outcomes, repo, unitSteps }) {
  for (const [unitId, { prNumber, step }] of Object.entries(unitSteps)) {
    if (prNumber === null || prNumber === undefined) {
      continue
    }

    const text = commentTextFor({ reason: outcomes[unitId], step })
    if (!text) {
      continue
    }
    const body = withCommentMarker({ text })

    const comments = await github.paginate(github.rest.issues.listComments, {
      issue_number: prNumber,
      owner,
      per_page: 100,
      repo,
    })
    const lastOurComment = comments
      .filter((comment) => comment.body?.includes(COMMENT_MARKER))
      .at(-1)
    if (lastOurComment?.body === body) {
      continue
    }

    await github.rest.issues.createComment({ body, issue_number: prNumber, owner, repo })
  }
}

function commentTextFor({ reason, step }) {
  if (step === 'blocked') {
    return BLOCKED_COMMENT
  }

  if (!reason) {
    return null
  }

  return `Today's run did not update this PR: ${reason.replace(/\.+$/, '')}.`
}

function setOutputs({ core, plan, staleNumbers, unitSteps }) {
  const stepOf = (unitId) => unitSteps[unitId]?.step
  const unitsWithSteps = (steps) =>
    plan.units
      .filter((unit) => steps.includes(stepOf(unit.id)))
      .map((unit) => ({ unitId: unit.id }))

  const researchMatrix = plan.research
    .filter((bumpId) => {
      const owners = plan.units.filter((unit) => unit.bumpIds.includes(bumpId))
      return owners.length === 0 || !owners.every((unit) => INACTIVE_STEPS.has(stepOf(unit.id)))
    })
    .map((bumpId) => ({ bumpId }))

  core.setOutput('unit_steps', JSON.stringify(unitSteps))
  core.setOutput('research_matrix', JSON.stringify(researchMatrix))
  core.setOutput('verify_matrix', JSON.stringify(unitsWithSteps(['create', 'update', 'dry-run'])))
  core.setOutput('open_pr_matrix', JSON.stringify(unitsWithSteps(['create', 'update'])))
  core.setOutput('stale_prs', JSON.stringify(staleNumbers))
}

async function decideStepForUnit({ github, openPr, owner, plan, ref, repo, unit }) {
  const prNumber = openPr?.number ?? null
  const headSha = openPr?.headSha ?? null
  const expectedBumps = expectedBumpsFor({ plan, unit })
  if (expectedBumps.length === 0) {
    return { headSha, prNumber, step: 'skip' }
  }

  const marker = markerForUnit({ bumps: expectedBumps, unit })
  const openState = openPr
    ? { hasForeignCommits: false, marker: parseMarker({ body: openPr.body }) }
    : null
  const rejectedPr = openPr ? null : await findRejectedPr({ github, owner, ref, repo, unit })

  let step = decideUnitStep({ isDefaultInputs: true, marker, openPr: openState, rejectedPr })
  if (step === 'update') {
    const commits = await listCommits({ github, owner, prNumber, repo })
    step = decideUnitStep({
      isDefaultInputs: true,
      marker,
      openPr: { ...openState, hasForeignCommits: hasForeignCommits({ commits }) },
      rejectedPr: null,
    })
  }

  return { headSha, prNumber, step }
}

/**
 * Group: non-major bumps without a fresh stored outcome, plus fallbacks whose major has one.
 * Major: the bump unless it has a fresh stored outcome.
 * @returns {Bump[]}
 */
function expectedBumpsFor({ plan, unit }) {
  const bumpsById = new Map(plan.bumps.map((bump) => [bump.id, bump]))
  const isStored = (bump) =>
    plan.stored.some((entry) => entry.dependency === bump.dependency && entry.to === bump.to)
  const unitBumps = unit.bumpIds.map((id) => bumpsById.get(id)).filter(Boolean)

  if (unit.kind === 'major') {
    return unitBumps.filter((bump) => !isStored(bump))
  }

  return unitBumps.filter((bump) => {
    if (isStored(bump)) {
      return false
    }
    if (!bump.fallbackFor) {
      return true
    }
    const major = bumpsById.get(bump.fallbackFor)
    return Boolean(major) && isStored(major)
  })
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
 * Only a person closing an unmerged PR counts as a rejection, and only if its body carries
 * a marker. Bot closes and unknown closers do not, because a missed security PR costs more
 * than a duplicate.
 */
async function findRejectedPr({ github, owner, ref, repo, unit }) {
  const { data } = await github.rest.pulls.list({
    direction: 'desc',
    head: `${owner}:${unit.branch}`,
    owner,
    per_page: CLOSED_PRS_PER_UNIT,
    repo,
    sort: 'updated',
    state: 'closed',
  })
  const candidates = data
    .filter((pr) => pr.merged_at === null && pr.closed_at && isBotPr({ owner, pr, ref, repo }))
    .sort((a, b) => Date.parse(b.closed_at) - Date.parse(a.closed_at))
    .map((pr) => ({ number: pr.number, marker: parseMarker({ body: pr.body }) }))
    .filter((pr) => pr.marker !== null)
    .slice(0, MAX_CLOSER_LOOKUPS)

  for (const candidate of candidates) {
    const { data: issue } = await github.rest.issues.get({
      issue_number: candidate.number,
      owner,
      repo,
    })
    if (issue.closed_by && issue.closed_by.type !== 'Bot') {
      return { marker: candidate.marker }
    }
  }

  return null
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
