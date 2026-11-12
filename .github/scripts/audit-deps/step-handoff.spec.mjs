import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  formatStepOutputs,
  isPreparedStep,
  parsePrSteps,
  parseStalePrs,
  readPrepared,
  writePrepared,
} from './step-handoff.mjs'

const plan = {
  prs: [
    { bumpIds: ['dep-1'], id: 'non-major' },
    { bumpIds: ['big-2'], id: 'big-2' },
  ],
}

const prSteps = {
  'big-2': { headSha: 'abc', prNumber: 7, step: 'update' },
  'non-major': { headSha: null, prNumber: null, step: 'create' },
}

describe('PR steps', () => {
  it('should read back the step outputs it formats', () => {
    const outputs = formatStepOutputs({ plan, prSteps, stalePrs: [12] })

    expect(parsePrSteps({ plan, text: outputs.pr_steps })).toEqual(prSteps)
    expect(parseStalePrs({ text: outputs.stale_prs })).toEqual([12])
  })

  it.each([
    [
      'an update with no PR number',
      { ...prSteps, 'big-2': { ...prSteps['big-2'], prNumber: null } },
    ],
    ['an unknown step', { ...prSteps, 'big-2': { ...prSteps['big-2'], step: 'merge' } }],
    ['a planned PR with no step', { 'non-major': prSteps['non-major'] }],
    ['a step for a PR that is not planned', { ...prSteps, gone: prSteps['non-major'] }],
  ])('should reject %s when it formats or parses', (_name, steps) => {
    expect(() => formatStepOutputs({ plan, prSteps: steps, stalePrs: [] })).toThrow(
      'invalid PR steps',
    )
    expect(() => parsePrSteps({ plan, text: JSON.stringify(steps) })).toThrow('invalid PR steps')
  })

  it.each(['{', '["a"]', '[0]', '{"n":1}'])('should reject the stale PR list %s', (text) => {
    expect(() => parseStalePrs({ text })).toThrow('invalid stale PR numbers')
  })

  it('should prepare a commit only for create, update and dry-run', () => {
    expect(
      ['create', 'update', 'dry-run', 'skip', 'skip-rejected', 'blocked'].filter((step) =>
        isPreparedStep({ step }),
      ),
    ).toEqual(['create', 'update', 'dry-run'])
  })
})

describe('prepared PRs', () => {
  const dirs = []

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
  })

  async function tempFile() {
    const dir = await mkdtemp(path.join(tmpdir(), 'audit-deps-handoff-'))
    dirs.push(dir)
    return path.join(dir, 'prepared.json')
  }

  const base = { branch: 'ci/audit-deps-fix-main-a', headSha: null, prId: 'a', prNumber: null }
  const created = {
    ...base,
    bodyFile: '/tmp/a.md',
    commit: 'c0ffee',
    isDraft: false,
    step: 'create',
    title: 't',
  }
  const failed = { ...base, failedStep: 'lockfile', reason: 'pnpm exited 1', step: 'create' }
  const held = { ...base, prId: 'b', prNumber: 9, step: 'blocked' }

  it('should read back every PR it writes', async () => {
    const file = await tempFile()

    await writePrepared({ file, prs: [created, failed, held] })

    expect(await readPrepared({ file })).toEqual([created, failed, held])
  })

  it.each([
    ['a prepared step with no commit', { ...created, commit: undefined }],
    ['a failure with no reason', { ...failed, reason: undefined }],
    ['an unknown step', { ...held, step: 'merge' }],
  ])('should refuse to write %s', async (_name, entry) => {
    await expect(writePrepared({ file: await tempFile(), prs: [entry] })).rejects.toThrow(
      'invalid prepared PRs',
    )
  })

  it.each([
    ['a missing file', null],
    ['invalid JSON', '{'],
    ['a prepared step with no commit', JSON.stringify({ prs: [{ ...created, commit: null }] })],
  ])('should fail closed on %s', async (_name, content) => {
    const file = await tempFile()
    if (content !== null) {
      await writeFile(file, content)
    }

    await expect(readPrepared({ file })).rejects.toThrow('invalid prepared PRs')
  })
})
