import { readFile, writeFile } from 'node:fs/promises'

const PREPARED_STEPS = new Set(['create', 'update', 'dry-run'])
const UNPREPARED_STEPS = new Set(['skip', 'skip-rejected', 'blocked'])

/**
 * The data that one workflow step gives to the next: `pr_steps` and `stale_prs` from Decide PR
 * steps, and prepared.json from prepare-prs. Each writer checks the shape and each reader checks
 * it again, so a bad handoff stops the run before it pushes or edits a PR.
 *
 * @typedef {object} PrStepEntry
 * @property {import('./decide.mjs').PrStep} step
 * @property {number | null} prNumber the open PR; an `update` always has one
 * @property {string | null} headSha the branch head for the push lease; null when no branch exists
 *
 * @typedef {object} PreparedPr one record for each planned PR
 * @property {string} prId
 * @property {string} branch
 * @property {import('./decide.mjs').PrStep} step
 * @property {number | null} prNumber
 * @property {string | null} headSha
 * @property {string} [failedStep] set when preparing the PR failed
 * @property {string} [reason] why it failed
 * @property {string} [commit] set for a prepared step that did not fail, with `bodyFile`,
 *   `isDraft` and `title`
 * @property {string} [bodyFile]
 * @property {boolean} [isDraft]
 * @property {string} [title]
 */

/** True for the steps that prepare-prs builds a commit for. */
export function isPreparedStep({ step }) {
  return PREPARED_STEPS.has(step)
}

/** Formats the Decide PR steps outputs. `prSteps` holds one entry for each PR in `plan`. */
export function formatStepOutputs({ plan, prSteps, stalePrs }) {
  assertPrSteps({ plan, prSteps })
  assertStalePrs({ stalePrs, text: JSON.stringify(stalePrs) })

  return { pr_steps: JSON.stringify(prSteps), stale_prs: JSON.stringify(stalePrs) }
}

/** @returns {Record<string, PrStepEntry>} */
export function parsePrSteps({ plan, text }) {
  const prSteps = parseJson({ error: 'invalid PR steps', text })
  assertPrSteps({ plan, prSteps })

  return prSteps
}

/** @returns {number[]} */
export function parseStalePrs({ text }) {
  const stalePrs = parseJson({ error: `invalid stale PR numbers: ${text}`, text: text || '[]' })
  assertStalePrs({ stalePrs, text })

  return stalePrs
}

/** @param {{ file: string, prs: PreparedPr[] }} params */
export async function writePrepared({ file, prs }) {
  assertPrepared({ prs })
  await writeFile(file, `${JSON.stringify({ prs }, null, 2)}\n`)
}

/**
 * A missing file fails like a bad one, so Publish never runs on a partial prepare.
 * @returns {Promise<PreparedPr[]>}
 */
export async function readPrepared({ file }) {
  let text
  try {
    text = await readFile(file, 'utf8')
  } catch {
    throw new Error(`invalid prepared PRs: cannot read ${file}`)
  }

  const { prs } = parseJson({ error: `invalid prepared PRs: ${file} is not JSON`, text }) ?? {}
  assertPrepared({ prs })
  return prs
}

function assertPrSteps({ plan, prSteps }) {
  const problem = findPrStepsProblem({ plan, prSteps })
  if (problem) {
    throw new Error(`invalid PR steps: ${problem}`)
  }
}

function findPrStepsProblem({ plan, prSteps }) {
  if (typeof prSteps !== 'object' || prSteps === null || Array.isArray(prSteps)) {
    return 'not an object'
  }

  const plannedIds = new Set(plan.prs.map((pr) => pr.id))
  const extra = Object.keys(prSteps).find((prId) => !plannedIds.has(prId))
  if (extra !== undefined) {
    return `${extra} is not a planned PR`
  }

  for (const prId of plannedIds) {
    const problem = findStepProblem({ entry: prSteps[prId] })
    if (problem) {
      return `${prId}: ${problem}`
    }
  }

  return null
}

function findStepProblem({ entry }) {
  if (!entry) {
    return 'no step'
  }
  if (!PREPARED_STEPS.has(entry.step) && !UNPREPARED_STEPS.has(entry.step)) {
    return `unknown step ${entry.step}`
  }
  if (entry.prNumber !== null && !isPrNumber({ value: entry.prNumber })) {
    return 'bad PR number'
  }
  if (entry.headSha !== null && typeof entry.headSha !== 'string') {
    return 'bad head SHA'
  }
  if (entry.step === 'update' && entry.prNumber === null) {
    return 'an update needs a PR number'
  }

  return null
}

function assertStalePrs({ stalePrs, text }) {
  if (!Array.isArray(stalePrs) || !stalePrs.every((value) => isPrNumber({ value }))) {
    throw new Error(`invalid stale PR numbers: ${text}`)
  }
}

function assertPrepared({ prs }) {
  if (!Array.isArray(prs)) {
    throw new Error('invalid prepared PRs: no list')
  }

  for (const entry of prs) {
    const problem = findPreparedProblem({ entry })
    if (problem) {
      throw new Error(`invalid prepared PRs: ${entry?.prId}: ${problem}`)
    }
  }
}

function findPreparedProblem({ entry }) {
  if (typeof entry?.prId !== 'string' || typeof entry.branch !== 'string') {
    return 'missing prId or branch'
  }

  const stepProblem = findStepProblem({ entry })
  if (stepProblem) {
    return stepProblem
  }
  if (entry.failedStep !== undefined) {
    return typeof entry.failedStep === 'string' && typeof entry.reason === 'string'
      ? null
      : 'a failure needs a step and a reason'
  }
  if (!isPreparedStep({ step: entry.step })) {
    return null
  }

  const isComplete =
    typeof entry.commit === 'string' &&
    typeof entry.bodyFile === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.isDraft === 'boolean'
  return isComplete ? null : 'a prepared PR needs a commit, body file, title and draft state'
}

function parseJson({ error, text }) {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(error)
  }
}

function isPrNumber({ value }) {
  return Number.isInteger(value) && value > 0
}
