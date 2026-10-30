import { describe, expect, it, vi } from 'vitest'

import { formatMarker } from './decide.mjs'
import { checkHeadUnchanged, closeStalePrs, commentOnFailedUnits, runPrecheck } from './github.mjs'

const OWNER = 'payloadcms'
const REPO = 'payload'
const REF = 'main'
const PREFIX = `ci/audit-deps-fix-${REF}-`

const bump = (overrides) => ({
  advisories: ['GHSA-aaaa-bbbb-cccc'],
  dependency: 'lodash',
  fallbackFor: null,
  id: 'lodash-4',
  isMajor: false,
  to: '4.17.21',
  ...overrides,
})

const lodash = bump({})
const react = bump({ dependency: 'react', id: 'react-19', isMajor: true, to: '19.0.0' })
const reactFallback = bump({
  dependency: 'react',
  fallbackFor: 'react-19',
  id: 'react-18-fallback',
  to: '18.3.1',
})

const groupUnit = (bumpIds) => ({
  branch: `${PREFIX}non-major`,
  bumpIds,
  id: 'non-major',
  kind: 'group',
})
const reactUnit = {
  branch: `${PREFIX}react-19`,
  bumpIds: ['react-19'],
  id: 'react-19',
  kind: 'major',
}

const makePlan = ({ bumps = [lodash, react], research, stored = [], units } = {}) => ({
  bumps,
  noFix: [],
  research: research ?? bumps.map((item) => item.id),
  stored,
  units: units ?? [groupUnit(['lodash-4']), reactUnit],
})

const markerOf = ({ bumps, unit }) =>
  formatMarker({
    marker: {
      advisories: [...new Set(bumps.flatMap((item) => item.advisories))],
      bumps: bumps.map((item) => [item.dependency, item.to]),
      unit,
    },
  })

const groupMarker = markerOf({ bumps: [lodash], unit: 'non-major' })
const reactMarker = markerOf({ bumps: [react], unit: 'react-19' })

const HIDDEN_LINE = '<!-- audit-deps-comment -->'
const withHiddenLine = (text) => `${text}\n\n${HIDDEN_LINE}`

const openPr = ({ body, branch, number, userType = 'Bot' }) => ({
  body,
  head: { ref: branch, repo: { full_name: `${OWNER}/${REPO}` }, sha: `sha-${number}` },
  number,
  state: 'open',
  user: { type: userType },
})

const closedPr = ({
  body,
  closedAt = '2026-01-02T00:00:00Z',
  mergedAt = null,
  number,
  userType = 'Bot',
}) => ({
  body,
  closed_at: closedAt,
  merged_at: mergedAt,
  number,
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
  closedBy = {},
  closedPrs = {},
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
      list: vi.fn(async ({ head }) => ({ data: closedPrs[head.split(':')[1]] ?? [] })),
      listCommits: vi.fn(),
      update: vi.fn(async () => ({})),
    },
  }
  const paginate = vi.fn(async (method, params) => {
    if (method === rest.pulls.list) {
      return openPrs
    }
    if (method === rest.pulls.listCommits) {
      return commits[params.pull_number] ?? []
    }
    return comments[params.issue_number] ?? []
  })

  return { paginate, rest }
}

const makeCore = () => ({ setOutput: vi.fn() })

async function precheck({ github, isDefaultInputs = true, plan = makePlan() }) {
  const core = makeCore()
  await runPrecheck({ core, github, isDefaultInputs, owner: OWNER, plan, ref: REF, repo: REPO })

  const raw = Object.fromEntries(core.setOutput.mock.calls)
  return {
    openPrMatrix: JSON.parse(raw.open_pr_matrix),
    raw,
    researchMatrix: JSON.parse(raw.research_matrix),
    stalePrs: JSON.parse(raw.stale_prs),
    unitSteps: JSON.parse(raw.unit_steps),
    verifyMatrix: JSON.parse(raw.verify_matrix),
  }
}

const botCommit = {
  author: { login: 'github-actions[bot]' },
  committer: { login: 'github-actions[bot]' },
}
const personCommit = { author: { login: 'someone' }, committer: { login: 'someone' } }

describe('runPrecheck', () => {
  it('should create every unit when no PR exists', async () => {
    const result = await precheck({ github: makeGithub() })

    expect(result.unitSteps).toEqual({
      'non-major': { headSha: null, prNumber: null, step: 'create' },
      'react-19': { headSha: null, prNumber: null, step: 'create' },
    })
    expect(result.verifyMatrix).toEqual([{ unitId: 'non-major' }, { unitId: 'react-19' }])
    expect(result.openPrMatrix).toEqual(result.verifyMatrix)
    expect(result.stalePrs).toEqual([])
  })

  it('should list a PR with no matching unit as stale', async () => {
    const github = makeGithub({
      openPrs: [
        openPr({ body: groupMarker, branch: `${PREFIX}non-major`, number: 1 }),
        openPr({ body: reactMarker, branch: `${PREFIX}gone-3`, number: 2 }),
        openPr({ body: '', branch: 'feature/unrelated', number: 3 }),
      ],
    })

    const result = await precheck({ github })

    expect(result.stalePrs).toEqual([2])
    expect(result.unitSteps['non-major']).toEqual({ headSha: 'sha-1', prNumber: 1, step: 'skip' })
  })

  it('should ignore a person-authored PR on the prefix', async () => {
    const github = makeGithub({
      openPrs: [
        openPr({ body: '', branch: `${PREFIX}gone-3`, number: 2, userType: 'User' }),
        openPr({ body: groupMarker, branch: `${PREFIX}non-major`, number: 1, userType: 'User' }),
      ],
    })

    const result = await precheck({ github })

    expect(result.stalePrs).toEqual([])
    expect(result.unitSteps['non-major']).toEqual({ headSha: null, prNumber: null, step: 'create' })
  })

  it('should ignore the marker of a person-authored closed PR', async () => {
    const github = makeGithub({
      closedBy: { 5: { type: 'User' } },
      closedPrs: {
        [`${PREFIX}non-major`]: [closedPr({ body: groupMarker, number: 5, userType: 'User' })],
      },
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major'].step).toBe('create')
  })

  it('should ignore open PRs from a fork', async () => {
    const forkPr = {
      ...openPr({ body: '', branch: `${PREFIX}gone-3`, number: 4 }),
      head: { ref: `${PREFIX}gone-3`, repo: { full_name: 'someone/payload' } },
    }

    const result = await precheck({ github: makeGithub({ openPrs: [forkPr] }) })

    expect(result.stalePrs).toEqual([])
  })

  it('should update an open PR whose marker differs', async () => {
    const github = makeGithub({
      commits: { 1: [botCommit] },
      openPrs: [
        openPr({
          body: '<!-- audit-deps: {"unit":"x"} -->',
          branch: `${PREFIX}non-major`,
          number: 1,
        }),
      ],
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major']).toEqual({ headSha: 'sha-1', prNumber: 1, step: 'update' })
    expect(result.openPrMatrix).toContainEqual({ unitId: 'non-major' })
  })

  it('should update an open PR whose valid marker differs', async () => {
    const github = makeGithub({
      commits: { 1: [botCommit] },
      openPrs: [
        openPr({
          body: markerOf({ bumps: [lodash], unit: 'other-unit' }),
          branch: `${PREFIX}non-major`,
          number: 1,
        }),
      ],
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major'].step).toBe('update')
  })

  it('should block when the bot authored but a person committed', async () => {
    const github = makeGithub({
      commits: {
        1: [{ author: { login: 'github-actions[bot]' }, committer: { login: 'someone' } }],
      },
      openPrs: [openPr({ body: 'x', branch: `${PREFIX}non-major`, number: 1 })],
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major'].step).toBe('blocked')
  })

  it('should block an open PR with a person commit and a changed marker', async () => {
    const github = makeGithub({
      commits: { 1: [botCommit, personCommit] },
      openPrs: [openPr({ body: 'no marker', branch: `${PREFIX}non-major`, number: 1 })],
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major']).toEqual({
      headSha: 'sha-1',
      prNumber: 1,
      step: 'blocked',
    })
    expect(result.verifyMatrix).not.toContainEqual({ unitId: 'non-major' })
  })

  it('should not fetch commits when the marker is equal', async () => {
    const github = makeGithub({
      openPrs: [openPr({ body: groupMarker, branch: `${PREFIX}non-major`, number: 1 })],
    })

    await precheck({ github })

    expect(github.rest.pulls.listCommits).not.toHaveBeenCalled()
  })

  it('should skip-reject when a person closed an unmerged PR with an equal marker', async () => {
    const github = makeGithub({
      closedBy: { 5: { type: 'User' } },
      closedPrs: { [`${PREFIX}non-major`]: [closedPr({ body: groupMarker, number: 5 })] },
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major']).toEqual({
      headSha: null,
      prNumber: null,
      step: 'skip-rejected',
    })
    expect(result.unitSteps['react-19'].step).toBe('create')
  })

  it.each([
    ['the bot closed it', { closedBy: { 5: { type: 'Bot' } } }, {}],
    ['closed_by is null', {}, {}],
    ['it was merged', { closedBy: { 5: { type: 'User' } } }, { mergedAt: '2026-01-01T00:00:00Z' }],
  ])('should create when %s', async (_name, github, pr) => {
    const result = await precheck({
      github: makeGithub({
        ...github,
        closedPrs: { [`${PREFIX}non-major`]: [closedPr({ body: groupMarker, number: 5, ...pr })] },
      }),
    })

    expect(result.unitSteps['non-major'].step).toBe('create')
  })

  it('should create when the closed PR has no marker', async () => {
    const github = makeGithub({
      closedBy: { 5: { type: 'User' } },
      closedPrs: { [`${PREFIX}non-major`]: [closedPr({ body: 'plain', number: 5 })] },
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major'].step).toBe('create')
  })

  it('should use the most recently closed person-closed PR', async () => {
    const github = makeGithub({
      closedBy: { 5: { type: 'User' }, 6: { type: 'Bot' } },
      closedPrs: {
        [`${PREFIX}non-major`]: [
          closedPr({ body: groupMarker, closedAt: '2026-01-01T00:00:00Z', number: 5 }),
          closedPr({ body: 'other', closedAt: '2026-01-05T00:00:00Z', number: 6 }),
        ],
      },
    })

    const result = await precheck({ github })

    expect(result.unitSteps['non-major'].step).toBe('skip-rejected')
  })

  it('should build the expected marker from expected bumps only', async () => {
    const plan = makePlan({
      bumps: [lodash, bump({ dependency: 'zod', id: 'zod-3', to: '3.25.0' })],
      stored: [{ dependency: 'zod', to: '3.25.0' }],
      units: [groupUnit(['lodash-4', 'zod-3'])],
    })
    const github = makeGithub({
      openPrs: [openPr({ body: groupMarker, branch: `${PREFIX}non-major`, number: 1 })],
    })

    const result = await precheck({ github, plan })

    expect(result.unitSteps['non-major']).toEqual({ headSha: 'sha-1', prNumber: 1, step: 'skip' })
  })

  it('should include a fallback when its major is stored', async () => {
    const plan = makePlan({
      bumps: [react, reactFallback],
      stored: [{ dependency: 'react', to: '19.0.0' }],
      units: [groupUnit(['react-18-fallback']), reactUnit],
    })
    const github = makeGithub({
      openPrs: [
        openPr({
          body: markerOf({ bumps: [reactFallback], unit: 'non-major' }),
          branch: `${PREFIX}non-major`,
          number: 1,
        }),
      ],
    })

    const result = await precheck({ github, plan })

    expect(result.unitSteps['non-major']).toEqual({ headSha: 'sha-1', prNumber: 1, step: 'skip' })
    expect(result.unitSteps['react-19']).toEqual({ headSha: null, prNumber: null, step: 'skip' })
  })

  it('should skip a unit with no expected bumps and keep its open PR', async () => {
    const plan = makePlan({
      stored: [{ dependency: 'react', to: '19.0.0' }],
      units: [reactUnit],
    })
    const github = makeGithub({
      openPrs: [openPr({ body: '', branch: reactUnit.branch, number: 7 })],
    })

    const result = await precheck({ github, plan })

    expect(result.unitSteps['react-19']).toEqual({ headSha: 'sha-7', prNumber: 7, step: 'skip' })
    expect(result.stalePrs).toEqual([])
  })

  it('should drop research bumps whose only unit is inactive', async () => {
    const github = makeGithub({
      openPrs: [openPr({ body: groupMarker, branch: `${PREFIX}non-major`, number: 1 })],
    })

    const result = await precheck({ github })

    expect(result.researchMatrix).toEqual([{ bumpId: 'react-19' }])
  })

  it('should drop research bumps whose unit is blocked', async () => {
    const github = makeGithub({
      commits: { 1: [personCommit] },
      openPrs: [openPr({ body: 'x', branch: `${PREFIX}non-major`, number: 1 })],
    })

    const result = await precheck({ github })

    expect(result.researchMatrix).toEqual([{ bumpId: 'react-19' }])
  })

  it('should drop research bumps whose unit is skip-rejected', async () => {
    const github = makeGithub({
      closedBy: { 5: { type: 'User' } },
      closedPrs: { [reactUnit.branch]: [closedPr({ body: reactMarker, number: 5 })] },
    })

    const result = await precheck({ github })

    expect(result.researchMatrix).toEqual([{ bumpId: 'lodash-4' }])
  })

  it('should drop a stored bump that plan.research omits', async () => {
    const plan = makePlan({
      research: ['lodash-4'],
      stored: [{ dependency: 'react', to: '19.0.0' }],
    })

    const result = await precheck({ github: makeGithub(), plan })

    expect(result.researchMatrix).toEqual([{ bumpId: 'lodash-4' }])
  })

  it('should dry-run every unit without calling the API for non-default inputs', async () => {
    const github = makeGithub()

    const result = await precheck({ github, isDefaultInputs: false })

    expect(result.unitSteps).toEqual({
      'non-major': { headSha: null, prNumber: null, step: 'dry-run' },
      'react-19': { headSha: null, prNumber: null, step: 'dry-run' },
    })
    expect(result.stalePrs).toEqual([])
    expect(result.researchMatrix).toEqual([{ bumpId: 'lodash-4' }, { bumpId: 'react-19' }])
    expect(result.verifyMatrix).toEqual([{ unitId: 'non-major' }, { unitId: 'react-19' }])
    expect(result.openPrMatrix).toEqual([])
    expect(github.paginate).not.toHaveBeenCalled()
    expect(github.rest.pulls.list).not.toHaveBeenCalled()
    expect(github.rest.issues.get).not.toHaveBeenCalled()
  })

  it('should set single-line JSON outputs', async () => {
    const result = await precheck({ github: makeGithub() })

    for (const value of Object.values(result.raw)) {
      expect(value).not.toContain('\n')
    }
  })
})

describe('closeStalePrs', () => {
  const staleBranch = `${PREFIX}gone-3`
  const open = stalePr()

  const close = (github, prNumbers = [3]) =>
    closeStalePrs({ github, owner: OWNER, prNumbers, ref: REF, repo: REPO })

  it('should comment, close, and delete the branch', async () => {
    const github = makeGithub({ prs: { 3: open } })

    await close(github)

    expect(github.rest.issues.createComment).toHaveBeenCalledWith({
      body: withHiddenLine('The audit no longer needs this update.'),
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
      ref: `heads/${staleBranch}`,
      repo: REPO,
    })
  })

  it('should keep the branch when a person committed to it', async () => {
    const github = makeGithub({
      commits: { 3: [botCommit, personCommit] },
      prs: { 3: open },
    })

    await close(github)

    expect(github.rest.issues.createComment.mock.calls[0][0].body).toBe(
      withHiddenLine(
        'The audit no longer needs this update. The branch has commits from a person, so it was not deleted.',
      ),
    )
    expect(github.rest.pulls.update).toHaveBeenCalled()
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it('should not touch a PR outside the ref prefix', async () => {
    const github = makeGithub({ prs: { 3: stalePr({ branch: 'feature/x' }) } })

    await close(github)

    expect(github.rest.pulls.update).not.toHaveBeenCalled()
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it('should not touch a person-authored PR', async () => {
    const github = makeGithub({ prs: { 3: stalePr({ userType: 'User' }) } })

    await close(github)

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
    expect(github.rest.pulls.update).not.toHaveBeenCalled()
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it('should not touch a PR from a fork', async () => {
    const github = makeGithub({ prs: { 3: stalePr({ fullName: 'someone/payload' }) } })

    await close(github)

    expect(github.rest.pulls.update).not.toHaveBeenCalled()
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it('should skip a PR that is already closed', async () => {
    const github = makeGithub({ prs: { 3: stalePr({ state: 'closed' }) } })

    await close(github)

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it('should log the PR number and rethrow when closing fails', async () => {
    const github = makeGithub({ prs: { 3: open } })
    github.rest.pulls.update.mockRejectedValue(new Error('nope'))
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(close(github)).rejects.toThrow('nope')

    expect(logger).toHaveBeenCalledWith(expect.stringContaining('#3'))
    logger.mockRestore()
  })

  it('should ignore a missing branch ref', async () => {
    const github = makeGithub({
      deleteRefError: Object.assign(new Error('gone'), { status: 422 }),
      prs: { 3: open },
    })

    await expect(close(github)).resolves.toBeUndefined()
  })

  it('should propagate other delete errors', async () => {
    const github = makeGithub({
      deleteRefError: Object.assign(new Error('boom'), { status: 500 }),
      prs: { 3: open },
    })

    await expect(close(github)).rejects.toThrow('boom')
  })
})

describe('commentOnFailedUnits', () => {
  const comment = ({ github, outcomes = {}, unitSteps }) =>
    commentOnFailedUnits({ github, outcomes, owner: OWNER, repo: REPO, unitSteps })

  it('should comment the reason on a unit with a PR', async () => {
    const github = makeGithub()

    await comment({
      github,
      outcomes: { 'non-major': 'lodash declined: breaking change' },
      unitSteps: { 'non-major': { prNumber: 4, step: 'skip' } },
    })

    expect(github.rest.issues.createComment).toHaveBeenCalledWith({
      body: withHiddenLine("Today's run did not update this PR: lodash declined: breaking change."),
      issue_number: 4,
      owner: OWNER,
      repo: REPO,
    })
  })

  it('should not comment on a unit without a PR', async () => {
    const github = makeGithub()

    await comment({
      github,
      outcomes: { 'non-major': 'failed' },
      unitSteps: { 'non-major': { prNumber: null, step: 'create' } },
    })

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
  })

  it('should comment on a blocked unit', async () => {
    const github = makeGithub()

    await comment({ github, unitSteps: { 'non-major': { prNumber: 4, step: 'blocked' } } })

    expect(github.rest.issues.createComment.mock.calls[0][0].body).toBe(
      withHiddenLine(
        'The audit found a different set of updates, but this branch has commits from a person, so it was not updated.',
      ),
    )
  })

  it('should not repeat an identical last comment of ours', async () => {
    const body = withHiddenLine("Today's run did not update this PR: build failed.")
    const github = makeGithub({
      comments: {
        4: [
          { body, user: { type: 'Bot' } },
          { body: 'thanks', user: { type: 'User' } },
        ],
      },
    })

    await comment({
      github,
      outcomes: { 'non-major': 'build failed' },
      unitSteps: { 'non-major': { prNumber: 4, step: 'skip' } },
    })

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
  })

  it('should ignore another bot comment when deduping', async () => {
    const body = withHiddenLine("Today's run did not update this PR: build failed.")
    const github = makeGithub({
      comments: {
        4: [
          { body, user: { type: 'Bot' } },
          { body: 'coverage report', user: { type: 'Bot' } },
        ],
      },
    })

    await comment({
      github,
      outcomes: { 'non-major': 'build failed' },
      unitSteps: { 'non-major': { prNumber: 4, step: 'skip' } },
    })

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
  })

  it('should comment again when the reason changed', async () => {
    const github = makeGithub({
      comments: {
        4: [
          {
            body: withHiddenLine("Today's run did not update this PR: old reason."),
            user: { type: 'Bot' },
          },
        ],
      },
    })

    await comment({
      github,
      outcomes: { 'non-major': 'new reason' },
      unitSteps: { 'non-major': { prNumber: 4, step: 'skip' } },
    })

    expect(github.rest.issues.createComment).toHaveBeenCalledTimes(1)
  })
})

describe('checkHeadUnchanged', () => {
  const check = ({ headSha, prs }) =>
    checkHeadUnchanged({
      github: makeGithub({ prs }),
      headSha,
      owner: OWNER,
      prNumber: 3,
      repo: REPO,
    })

  it('should be true when the head sha is unchanged', async () => {
    expect(await check({ headSha: 'abc', prs: { 3: { head: { sha: 'abc' } } } })).toBe(true)
  })

  it('should be false when the head sha moved', async () => {
    expect(await check({ headSha: 'abc', prs: { 3: { head: { sha: 'def' } } } })).toBe(false)
  })
})
