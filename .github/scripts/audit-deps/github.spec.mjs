import { describe, expect, it, vi } from 'vitest'

import { closeStalePr, commentBlocked, runPrecheck } from './github.mjs'

const OWNER = 'payloadcms'
const REPO = 'payload'
const REF = 'main'
const HEAD = `${OWNER}:ci/audit-deps-fix-${REF}`
const FIXABLE = ['GHSA-aaaa-bbbb-cccc']
const MARKER = '<!-- audit-deps-advisories: GHSA-aaaa-bbbb-cccc -->'
const BLOCKED_MARKER = '<!-- audit-deps-blocked: GHSA-aaaa-bbbb-cccc -->'

function makeGithub({
  closedBy = null,
  closedPrs = [],
  comments = [],
  commits = [],
  deleteRefError = null,
  openPrs = [],
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
      get: vi.fn(async () => ({ data: { closed_by: closedBy } })),
      listComments: vi.fn(),
    },
    pulls: {
      list: vi.fn(async ({ state }) => ({ data: state === 'open' ? openPrs : closedPrs })),
      listCommits: vi.fn(),
      update: vi.fn(async () => ({})),
    },
  }
  const results = new Map([
    [rest.issues.listComments, comments],
    [rest.pulls.listCommits, commits],
  ])
  const paginate = vi.fn(async (method) => results.get(method))

  return { paginate, rest }
}

const makeCore = () => ({ setOutput: vi.fn() })

const outputs = (core) => Object.fromEntries(core.setOutput.mock.calls)

const precheck = ({ core = makeCore(), github, isDefaultInputs = true }) =>
  runPrecheck({
    core,
    fixable: FIXABLE,
    github,
    isDefaultInputs,
    owner: OWNER,
    ref: REF,
    repo: REPO,
  }).then(() => outputs(core))

const botCommit = { author: { login: 'github-actions[bot]' } }

describe('runPrecheck', () => {
  it('sets create when no PR', async () => {
    const github = makeGithub()

    expect(await precheck({ github })).toEqual({
      has_foreign_commits: 'false',
      next_step: 'create',
      pr_number: '',
    })
    expect(github.rest.pulls.list).toHaveBeenCalledWith({
      base: REF,
      head: HEAD,
      owner: OWNER,
      repo: REPO,
      state: 'open',
    })
  })

  it('sets skip when marker matches', async () => {
    const github = makeGithub({
      commits: [botCommit],
      openPrs: [{ body: `text\n${MARKER}\n`, number: 7 }],
    })

    expect(await precheck({ github })).toEqual({
      has_foreign_commits: 'false',
      next_step: 'skip',
      pr_number: '7',
    })
  })

  it('sets blocked on foreign commit', async () => {
    const github = makeGithub({
      commits: [botCommit, { author: { login: 'someone' } }],
      openPrs: [{ body: '<!-- audit-deps-advisories: GHSA-zzzz-zzzz-zzzz -->', number: 8 }],
    })

    expect(await precheck({ github })).toEqual({
      has_foreign_commits: 'true',
      next_step: 'blocked',
      pr_number: '8',
    })
  })

  it('sets update when the set changed and only the bot committed', async () => {
    const github = makeGithub({
      commits: [botCommit],
      openPrs: [{ body: 'no marker', number: 9 }],
    })

    expect(await precheck({ github })).toEqual({
      has_foreign_commits: 'false',
      next_step: 'update',
      pr_number: '9',
    })
  })

  it('sets skip when a person closed a PR with the same marker', async () => {
    const github = makeGithub({
      closedBy: { type: 'User' },
      closedPrs: [{ body: MARKER, merged_at: null, number: 5 }],
    })

    expect(await precheck({ github })).toEqual({
      has_foreign_commits: 'false',
      next_step: 'skip',
      pr_number: '',
    })
    expect(github.rest.pulls.list).toHaveBeenCalledWith({
      base: REF,
      direction: 'desc',
      head: HEAD,
      owner: OWNER,
      per_page: 1,
      repo: REPO,
      sort: 'updated',
      state: 'closed',
    })
  })

  it('sets create when the bot closed the previous PR', async () => {
    const github = makeGithub({
      closedBy: { type: 'Bot' },
      closedPrs: [{ body: MARKER, merged_at: null, number: 5 }],
    })

    expect((await precheck({ github })).next_step).toBe('create')
  })

  it('sets create when closed_by is null', async () => {
    const github = makeGithub({
      closedBy: null,
      closedPrs: [{ body: MARKER, merged_at: null, number: 5 }],
    })

    expect((await precheck({ github })).next_step).toBe('create')
  })

  it('sets create when the previous closed PR was merged', async () => {
    const github = makeGithub({
      closedBy: { type: 'User' },
      closedPrs: [{ body: MARKER, merged_at: '2026-01-01T00:00:00Z', number: 5 }],
    })

    expect((await precheck({ github })).next_step).toBe('create')
  })

  it('sets dry-run for non-default inputs and does not call pulls.list', async () => {
    const github = makeGithub()

    expect(await precheck({ github, isDefaultInputs: false })).toEqual({
      has_foreign_commits: 'false',
      next_step: 'dry-run',
      pr_number: '',
    })
    expect(github.rest.pulls.list).not.toHaveBeenCalled()
    expect(github.paginate).not.toHaveBeenCalled()
  })
})

describe('closeStalePr', () => {
  const close = (github, { hasForeignCommits = false } = {}) =>
    closeStalePr({ github, hasForeignCommits, owner: OWNER, prNumber: 3, ref: REF, repo: REPO })

  it('comments, closes, deletes branch', async () => {
    const github = makeGithub()

    await close(github)

    expect(github.rest.issues.createComment).toHaveBeenCalledWith({
      body: 'Base branch `main` has no fixable findings; closing.',
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
      ref: 'heads/ci/audit-deps-fix-main',
      repo: REPO,
    })
  })

  it('keeps the branch when a person committed to it', async () => {
    const github = makeGithub()

    await close(github, { hasForeignCommits: true })

    expect(github.rest.issues.createComment).toHaveBeenCalledWith({
      body:
        'Base branch `main` has no fixable findings; closing. ' +
        'The branch has commits from a person, so it was not deleted.',
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
    expect(github.rest.git.deleteRef).not.toHaveBeenCalled()
  })

  it('ignores a missing branch ref', async () => {
    const github = makeGithub({ deleteRefError: Object.assign(new Error('gone'), { status: 422 }) })

    await expect(close(github)).resolves.toBeUndefined()
  })

  it('propagates other delete errors', async () => {
    const github = makeGithub({ deleteRefError: Object.assign(new Error('boom'), { status: 500 }) })

    await expect(close(github)).rejects.toThrow('boom')
  })
})

describe('commentBlocked', () => {
  const comment = (github) =>
    commentBlocked({ fixable: FIXABLE, github, owner: OWNER, prNumber: 4, repo: REPO })

  it('posts a comment ending with the blocked marker', async () => {
    const github = makeGithub({ comments: [{ body: 'unrelated' }] })

    await comment(github)

    const { body } = github.rest.issues.createComment.mock.calls[0][0]
    expect(body.endsWith(BLOCKED_MARKER)).toBe(true)
  })

  it('does not repeat same comment', async () => {
    const github = makeGithub({ comments: [{ body: `earlier\n${BLOCKED_MARKER}` }] })

    await comment(github)

    expect(github.rest.issues.createComment).not.toHaveBeenCalled()
  })
})
