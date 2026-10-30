import { writeFile } from 'node:fs/promises'

import { mergeStore, pruneStore, readStore, writeStore } from '../store.mjs'
import {
  findBump,
  findStoredEntry,
  isMajorDeclined,
  readJson,
  readOptionalText,
  readPlan,
  readResearchResults,
  readVerifyResult,
  renderNoFixList,
  repoUrlFromEnv,
  requireOption,
  toSummaryText,
  writeJson,
  writeOutputs,
  writeSummary,
} from './shared.mjs'

const RED_STATUSES = new Set(['declined', 'failed', 'stored'])
const UNIT_STEP_OUTCOMES = {
  blocked: { status: 'skipped', reason: 'the PR branch has commits from a person' },
  skip: { status: 'skipped', reason: 'the open PR is up to date' },
  'skip-rejected': { status: 'rejected', reason: 'a person closed the PR for this change' },
}

/**
 * @typedef {'applied' | 'declined' | 'failed' | 'stored' | 'rejected' | 'skipped'} BumpStatus
 *
 * @typedef {object} BumpOutcome
 * @property {string} bumpId
 * @property {string} dependency
 * @property {string} to
 * @property {BumpStatus} status
 * @property {string} reason sanitized, one line
 */

/**
 * `store-update --store --plan --research-dir --verify-dir --ref --out`: drops expired
 * entries, then records today's Codex declines and verify failures. `--store` may be missing.
 */
export async function runStoreUpdate({ options }) {
  const plan = await readPlan({ options })
  const ref = requireOption({ name: 'ref', options })
  const verifyDir = requireOption({ name: 'verify-dir', options })
  const now = new Date()
  const at = now.toISOString()
  const entries = readStore({
    text: await readOptionalText({ file: requireOption({ name: 'store', options }) }),
  })
  const research = await readResearchResults({
    bumpIds: plan.research ?? [],
    researchDir: requireOption({ name: 'research-dir', options }),
  })

  const updates = []
  for (const bumpId of plan.research ?? []) {
    if (research[bumpId]?.decision !== 'decline') {
      continue
    }
    const { dependency, to } = findBump({ plan, bumpId })
    updates.push({ ref, dependency, to, outcome: 'declined', reason: research[bumpId].reason, at })
  }
  for (const unit of plan.units) {
    const verify = await readVerifyResult({ unit, verifyDir })
    for (const { bumpId, step } of verify?.failed ?? []) {
      const { dependency, to } = findBump({ plan, bumpId })
      updates.push({ ref, dependency, to, outcome: 'failed', reason: `failed at ${step}`, at })
    }
  }

  const merged = mergeStore({ entries: pruneStore({ entries, now }), updates })
  await writeFile(requireOption({ name: 'out', options }), writeStore({ entries: merged }))
}

/**
 * `outcomes --plan --research-dir --verify-dir --unit-steps --out`. `--unit-steps` is a JSON
 * file `{ [unitId]: { step, prNumber } }` from precheck. Writes `{ units, bumps }`, where
 * `units` holds the comment reason for each unit with an open PR and a declined, failed, or
 * stored bump. Writes the run summary and outputs `is_red`.
 */
export async function runOutcomes({ options }) {
  const plan = await readPlan({ options })
  const unitSteps = await readUnitSteps({ file: requireOption({ name: 'unit-steps', options }) })
  const verifyDir = requireOption({ name: 'verify-dir', options })
  const research = await readResearchResults({
    bumpIds: plan.bumps.map((bump) => bump.id),
    researchDir: requireOption({ name: 'research-dir', options }),
  })

  const bumps = []
  const units = {}
  for (const unit of plan.units) {
    const verify = await readVerifyResult({ unit, verifyDir })
    const step = unitSteps[unit.id]?.step
    const results = unit.bumpIds.map((bumpId) =>
      decideBumpOutcome({ bump: findBump({ plan, bumpId }), plan, research, step, verify }),
    )
    bumps.push(...results)

    const reasons = results.map((result) => result.commentReason).filter(Boolean)
    if (unitSteps[unit.id]?.prNumber && reasons.length > 0) {
      units[unit.id] = reasons.join('; ')
    }
  }

  const order = new Map(plan.bumps.map((bump, index) => [bump.id, index]))
  const outcomes = {
    units,
    bumps: bumps
      .sort((a, b) => order.get(a.bumpId) - order.get(b.bumpId))
      .map(({ bumpId, dependency, to, status, reason }) => ({
        bumpId,
        dependency,
        to,
        status,
        reason,
      })),
  }
  const isRed =
    outcomes.bumps.some((bump) => RED_STATUSES.has(bump.status)) ||
    Object.values(unitSteps).some((unitStep) => unitStep?.step === 'blocked')

  await writeJson({ file: requireOption({ name: 'out', options }), value: outcomes })
  await writeOutputs({ values: { is_red: String(isRed) } })
  await writeSummary({ markdown: renderOutcomesSummary({ outcomes, plan, unitSteps }) })
}

/**
 * Order: rejected unit, unused fallback, fresh stored outcome (red even in a skipped unit),
 * skipped or blocked unit, then research and verify.
 * `commentReason` is the text for a PR comment, or null when the bump needs none.
 */
function decideBumpOutcome({ bump, plan, research, step, verify }) {
  const label = toSummaryText({ text: `${bump.dependency} ${bump.to}`, maxLength: 200 })
  const outcome = ({ status, reason = '', commentReason = null }) => ({
    bumpId: bump.id,
    dependency: bump.dependency,
    to: bump.to,
    status,
    reason,
    commentReason,
  })
  const failed = ({ reason, failedStep }) =>
    outcome({ status: 'failed', reason, commentReason: `${label} failed at ${failedStep}` })

  if (step === 'skip-rejected') {
    return outcome(UNIT_STEP_OUTCOMES[step])
  }

  if (bump.fallbackFor && !isMajorDeclined({ majorId: bump.fallbackFor, plan, research })) {
    const major = findBump({ plan, bumpId: bump.fallbackFor })
    return outcome({
      status: 'skipped',
      reason: toSummaryText({
        text: `not needed: ${major.dependency} ${major.to} is in its own unit`,
      }),
    })
  }

  const stored = findStoredEntry({ plan, bump })
  if (stored) {
    const storedReason = toCommentText({ text: stored.reason })
    return outcome({
      status: 'stored',
      reason: toSummaryText({ text: `${stored.outcome} on an earlier run: ${stored.reason}` }),
      // A skip unit's PR is unchanged, so its stored bump was already reported.
      commentReason:
        step === 'skip'
          ? null
          : `${label} was declined or failed on an earlier run: ${storedReason}`,
    })
  }

  if (Object.hasOwn(UNIT_STEP_OUTCOMES, step ?? '')) {
    return outcome(UNIT_STEP_OUTCOMES[step])
  }

  const result = research[bump.id]
  if (!result) {
    return failed({ reason: 'no valid research result', failedStep: 'research' })
  }
  if (result.decision === 'decline') {
    return outcome({
      status: 'declined',
      reason: toSummaryText({ text: result.reason }),
      commentReason: `${label} was declined: ${toCommentText({ text: result.reason })}`,
    })
  }
  const failure = verify?.failed.find((candidate) => candidate.bumpId === bump.id)
  if (failure) {
    return failed({ reason: `failed at ${failure.step}`, failedStep: failure.step })
  }
  if (!verify?.passed.includes(bump.id)) {
    return failed({ reason: 'no verify result', failedStep: 'verify' })
  }

  return outcome({ status: 'applied' })
}

// A comment wraps the reason in a sentence that ends with its own period.
function toCommentText({ text }) {
  return toSummaryText({ text }).replace(/[.\s]+$/, '')
}

async function readUnitSteps({ file }) {
  const value = await readJson({ file })
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('--unit-steps must be a JSON object keyed by unit id')
  }

  return value
}

function renderOutcomesSummary({ outcomes, plan, unitSteps }) {
  const lines = ['## Audit outcomes', '']

  for (const result of outcomes.bumps) {
    const bump = findBump({ plan, bumpId: result.bumpId })
    const change = toSummaryText({
      text: `${bump.dependency} ${bump.fromVersion || bump.from} → ${bump.to}`,
      maxLength: 300,
    })
    const reason = result.reason ? `: ${result.reason}` : ''
    lines.push(`- ${change}: ${result.status}${reason}`)
  }

  lines.push(...renderNoFixList({ noFix: plan.noFix ?? [] }))

  const repoUrl = repoUrlFromEnv()
  const links = plan.units
    .filter((unit) => /^\d+$/.test(String(unitSteps[unit.id]?.prNumber ?? '')))
    .map((unit) => `- ${unit.id}: ${repoUrl}/pull/${unitSteps[unit.id].prNumber}`)
  if (links.length > 0) {
    lines.push('', '### Pull requests', '', ...links)
  }

  return lines.join('\n')
}
