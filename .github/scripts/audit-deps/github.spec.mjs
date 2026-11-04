import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatFingerprint } from './decide.mjs'
import { closeStalePrs, decidePrSteps } from './github.mjs'

const OWNER = 'payloadcms'
const REPO = 'payload'
const REF = 'main'
const PREFIX = `ci/audit-deps-fix-${REF}-`
const FORK = 'someone/payload'

const lodash = {
  advisories: ['GHSA-aaaa-bbbb-cccc'],
  dependency: 'lodash',
  id: 'lodash-4',
  isMajor: false,
  to: '4.17.21',
}
const react = { ...lodash, dependency: 'react', id: 'react-19', isMajor: true, to: '19.0.0' }

const plan = {
  bumps: [lodash, react],
  noFix: [],
  prs: [
    { branch: `${PREFIX}non-major`, bumpIds: ['lodash-4'], id: 'non-major', kind: 'group' },
    { branch: `${PREFIX}react-19`, bumpIds: ['react-19'], id: 'react-19', kind: 'major' },
  ],
}

const fingerprintOf = ({ bumps, prId }) =>
  formatFingerprint({
    fingerprint: {
      advisories: [...new Set(bumps.flatMap((item) => item.advisories))],
      bumps: bumps.map((item) => [item.dependency, item.to]),
      prId,
    },
  })

const groupFingerprint = fingerprintOf({ bumps: [lodash], prId: 'non-major' })
const reactFingerprint = fingerprintOf({ bumps: [react], prId: 'react-19' })

const botCommit = {
  author: { login: 'github-actions[bot]' },
  committer: { login: 'github-actions[bot]' },
}
const personCommit = { author: { login: 'someone' }, committer: { login: 'someone' } }

const openPr = ({
  body = groupFingerprint,
  branch = `${PREFIX}non-major`,
  fullName = `${OWNER}/${REPO}`,
  number = 1,
  userType = 'Bot',
}) => ({
  body,
  head: { ref: branch, repo: { full_name: fullName }, sha: `sha-${number}` },
  number,
  state: 'open',
  user: { type: userType },
})

const closedPr = ({
  body = groupFingerprint,
  fullName = `${OWNER}/${REPO}`,
  mergedAt = null,
  userType = 'Bot',
}) => ({
  body,
  closed_at: '2026-01-02T00:00:00Z',
  head: { ref: `${PREFIX}non-major`, repo: { full_name: fullName } },
  merged_at: mergedAt,
  number: 5,
  user: { type: userType },
})

const stalePr = ({
  branch = `${PREFIX}gone-3`,
  fullName = `${OWNER}/${REPO}`,
  state = 'open',
  userType = 'Bot',
} = {}) => ({
  head: { ref: branch, repo: { full_name: fullName } },
  state,
  user: { type: userType },
})

function makeGithub({
  branches = {},
  closedBy = {},
  closedPrs = [],
  comments = {},
  commits = {},
  deleteRefError = null,
  openPrs = [],
  prs = {},
} = {}) {
  const rest = {
    git: {
      deleteRef: vi.fn(async () => {
        if (deleteRefError) {
          throw deleteRefError
        }
        return {}
      }),
      getRef: vi.fn(async ({ ref }) => {
        const branch = branches[ref.replace(/^heads\//, '')]
        if (!branch) {
          throw Object.assign(new Error('Not Found'), { status: 404 })
        }
        return { data: { object: { sha: branch.sha } } }
      }),
    },
    repos: {
      compareCommits: vi.fn(async ({ head }) => ({
        data: { commits: branches[head]?.commits ?? [] },
      })),
    },
    issues: {
      createComment: vi.fn(async () => ({})),
      get: vi.fn(async ({ issue_number }) => ({
        data: { closed_by: closedBy[issue_number] ?? null },
      })),
      listComments: vi.fn(),
    },
    pulls: {
      get: vi.fn(async ({ pull_number }) => ({ data: prs[pull_number] })),
      list: vi.fn(async ({ head }) => ({
        data: head === `${OWNER}:${PREFIX}non-major` ? closedPrs : [],
      })),
      listCommits: vi.fn(),
      update: vi.fn(async () => ({})),
    },
  }
  const paginate = vi.fn(async (method, params) => {
    if (method === rest.pulls.list) {
      return openPrs
    }
    if (method === rest.issues.listComments) {
      return comments[params.issue_number] ?? []
    }
    return commits[params.pull_number] ?? []
  })

  return { paginate, rest }
}

async function planPrs({ github }) {
  const core = { setOutput: vi.fn() }
  await decidePrSteps({
    core,
    github,
    isDefaultInputs: true,
    owner: OWNER,
    plan,
    ref: REF,
    repo: REPO,
  })

  const outputs = Object.fromEntries(core.setOutput.mock.calls)
  return { prSteps: JSON.parse(outputs.pr_steps), stalePrs: JSON.parse(outputs.stale_prs) }
}

describe('decidePrSteps', () => {
  it('should create with a lease on a leftover branch that has only bot commits', async () => {
    const github = makeGithub({
      branches: { [`${PREFIX}non-major`]: { commits: [botCommit], sha: 'leftover' } },
    })

    const result = await planPrs({ github })

    expect(github.rest.repos.compareCommits).toHaveBeenCalledWith({
      base: REF,
      head: `${PREFIX}non-major`,
      owner: OWNER,
      repo: REPO,
    })
    expect(result.prSteps['non-major']).toEqual({
      headSha: 'leftover',
      prNumber: null,
      step: 'create',
    })
  })

  it('should block a leftover branch that has a person commit', async () => {
    const github = makeGithub({
      branches: {
        [`${PREFIX}non-major`]: { commits: [botCommit, personCommit], sha: 'leftover' },
      },
    })

    const result = await planPrs({ github })

    expect(result.prSteps['non-major']).toEqual({
      headSha: 'leftover',
      prNumber: null,
      step: 'blocked',
    })
  })

  it('should list a bot PR with no matching planned PR as stale', async () => {
    const github = makeGithub({
      openPrs: [
        openPr({ number: 1 }),
        openPr({ body: reactFingerprint, branch: `${PREFIX}gone-3`, number: 2 }),
        openPr({ body: '', branch: 'feature/unrelated', number: 3 }),
      ],
    })

    const result = await planPrs({ github })

    expect(result.stalePrs).toEqual([2])
    expect(result.prSteps['non-major']).toEqual({ headSha: 'sha-1', prNumber: 1, step: 'skip' })
  })

  it.each([
    ['person-authored', { userType: 'User' }],
    ['fork', { fullName: FORK }],
  ])('should ignore a %s open PR on the prefix', async (_name, overrides) => {
    const github = makeGithub({
      openPrs: [
        openPr({ ...overrides, branch: `${PREFIX}gone-3`, number: 2 }),
        openPr({ ...overrides, number: 1 }),
      ],
    })

    const result = await planPrs({ github })

    expect(result.stalePrs).toEqual([])
    expect(result.prSteps['non-major'].step).toBe('create')
  })

  it('should update an open PR whose fingerprint differs', async () => {
    const github = makeGithub({
      commits: { 1: [botCommit] },
      openPrs: [openPr({ body: fingerprintOf({ bumps: [lodash], prId: 'other-pr' }) })],
    })

    const result = await planPrs({ github })

    expect(result.prSteps['non-major']).toEqual({ headSha: 'sha-1', prNumber: 1, step: 'update' })
  })

  it('should block an open PR with a person commit and a changed fingerprint', async () => {
    const github = makeGithub({
      commits: { 1: [botCommit, personCommit] },
      openPrs: [openPr({ body: 'no fingerprint' })],
    })

    const result = await planPrs({ github })

    expect(result.prSteps['non-major']).toEqual({ headSha: 'sha-1', prNumber: 1, step: 'blocked' })
  })

  it.each([
    ['dirty', 'update'],
    ['clean', 'skip'],
  ])(
    'should treat an equal fingerprint with mergeable_state %s as %s',
    async (mergeableState, step) => {
      const github = makeGithub({
        commits: { 1: [botCommit] },
        openPrs: [openPr({})],
        prs: { 1: { mergeable_state: mergeableState } },
      })

      const result = await planPrs({ github })

      expect(result.prSteps['non-major'].step).toBe(step)
    },
  )

  describe('while GitHub computes mergeability', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    async function planWithStates({ states }) {
      vi.useFakeTimers()
      const github = makeGithub({ commits: { 1: [botCommit] }, openPrs: [openPr({})] })
      for (const state of states) {
        github.rest.pulls.get.mockResolvedValueOnce({ data: { mergeable_state: state } })
      }
      const pending = planPrs({ github })
      await vi.runAllTimersAsync()

      return { github, result: await pending }
    }

    it('should ask again when mergeable_state is unknown', async () => {
      const { github, result } = await planWithStates({ states: ['unknown', 'dirty'] })

      expect(github.rest.pulls.get).toHaveBeenCalledTimes(2)
      expect(result.prSteps['non-major'].step).toBe('update')
    })

    it('should skip after three unknown answers', async () => {
      const { github, result } = await planWithStates({
        states: ['unknown', 'unknown', 'unknown', 'dirty'],
      })

      expect(github.rest.pulls.get).toHaveBeenCalledTimes(3)
      expect(result.prSteps['non-major'].step).toBe('skip')
    })
  })

  it('should skip-reject when a person closed an unmerged PR with an equal fingerprint', async () => {
    const github = makeGithub({ closedBy: { 5: { type: 'User' } }, closedPrs: [closedPr({})] })

    const result = await planPrs({ github })

    expect(result.prSteps['non-major']).toEqual({
      headSha: null,
      prNumber: null,
      step: 'skip-rejected',
    })
    expect(result.prSteps['react-19'].step).toBe('create')
  })

  it.each([
    ['the bot closed it', { 5: { type: 'Bot' } }, {}],
    ['closed_by is null', {}, {}],
    ['it was merged', { 5: { type: 'User' } }, { mergedAt: '2026-01-01T00:00:00Z' }],
    ['it came from a fork', { 5: { type: 'User' } }, { fullName: FORK }],
    ['a person authored it', { 5: { type: 'User' } }, { userType: 'User' }],
    ['it has no fingerprint', { 5: { type: 'User' } }, { body: 'plain' }],
  ])('should create when a closed PR exists but %s', async (_name, closedBy, pr) => {
    const github = makeGithub({ closedBy, closedPrs: [closedPr(pr)] })

    const result = await planPrs({ github })

    expect(result.prSteps['non-major'].step).toBe('create')
  })
})

describe('closeStalePrs', () => {
  const close = (github) =>
    closeStalePrs({ github, owner: OWNER, prNumbers: [3], ref: REF, repo: REPO })

  it('should comment, close, and delete the branch', async () => {
    const github = makeGithub({ prs: { 3: stalePr() } })

    await close(github)

    expect(github.rest.issues.createComment).toHaveBeenCalledWith({
      body: 'The audit no longer needs this update.\n\n<!-- audit-deps-comment -->',
      issue_number: 3,
      owner: OWNER,
      repo: REPO,
    })
    expect(github.rest.pulls.update).toHaveBeenCalledWith({
      owner: OWNER,
      pull_number: 3,
      repo: REPO,
      state: 'closed',
    })
    expect(github.rest.git.deleteRef).toHaveBeenCalledWith({
      owner: OWNER,
      ref: `heads/${PREFIX}gone-3`,
      repo: REPO,
    })
  })

  // A prior run can post the comment and then fail to close the PR.
  it('should not comment again when the bot already left its stale comment', async () => {
    const github = makeGithub({
      comments: {
        3: [
          {
            body: 'The audit no longer needs this update.\n\n<!-- audit-deps-comment -->',
            user: { type: 'Bot' },
          },
        ],
      },
      prs: { 3: stalePr() },
    })

    await close(github)

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
    expect(github.rest.pulls.update).toHaveBeenCalledWith({
      owner: OWNER,
      pull_number: 3,
      repo: REPO,
      state: 'closed',
    })
    expect(github.rest.git.deleteRef).toHaveBeenCalled()
  })

  it('should keep the branch when a person committed to it', async () => {
    const github = makeGithub({ commits: { 3: [botCommit, personCommit] }, prs: { 3: stalePr() } })

    await close(github)

    expect(github.rest.issues.createComment.mock.calls[0][0].body).toBe(
      'The audit no longer needs this update. The branch has commits from a person, so it was not deleted.\n\n<!-- audit-deps-comment -->',
    )
    expect(github.rest.pulls.update).toHaveBeenCalled()
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it.each([
    ['outside the ref prefix', { branch: 'feature/x' }],
    ['person-authored', { userType: 'User' }],
    ['from a fork', { fullName: FORK }],
    ['already closed', { state: 'closed' }],
  ])('should not touch a PR %s', async (_name, overrides) => {
    const github = makeGithub({ prs: { 3: stalePr(overrides) } })

    await close(github)

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
    expect(github.rest.pulls.update).not.toHaveBeenCalled()
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it('should ignore a missing branch ref', async () => {
    const github = makeGithub({
      deleteRefError: Object.assign(new Error('gone'), { status: 422 }),
      prs: { 3: stalePr() },
    })

    await expect(close(github)).resolves.toBeUndefined()
  })
})
