import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isPreparedStep, writePrepared as writePreparedFile } from '../step-handoff.mjs'
import { pushBranch, runPublish } from './publish.mjs'

const FAIL_TEXT = 'Some audit PRs for main were not opened or updated; see the run summary'

describe('runPublish', () => {
  let preparedDir

  beforeEach(async () => {
    preparedDir = await mkdtemp(path.join(tmpdir(), 'publish-'))
  })

  afterEach(async () => {
    await rm(preparedDir, { force: true, recursive: true })
  })

  async function writePrepared({ prs }) {
    const entries = []
    for (const pr of prs) {
      const entry = {
        branch: `ci/audit-deps-fix-main-${pr.prId}`,
        headSha: null,
        prNumber: null,
        step: 'create',
        ...pr,
      }
      if (!isPreparedStep({ step: entry.step })) {
        entries.push(entry)
        continue
      }
      const bodyFile = path.join(preparedDir, `${pr.prId}.md`)
      await writeFile(bodyFile, `body ${pr.prId}`)
      entries.push({
        bodyFile,
        commit: 'c0ffee',
        isDraft: false,
        title: `title ${pr.prId}`,
        ...entry,
      })
    }
    await writePreparedFile({ file: path.join(preparedDir, 'prepared.json'), prs: entries })
  }

  function makeFakes() {
    let summary = ''
    const core = {
      setFailed: vi.fn(),
      setSecret: vi.fn(),
      summary: {
        addRaw: vi.fn((text) => {
          summary += text
          return core.summary
        }),
        write: vi.fn(async () => {}),
      },
    }
    const github = {
      rest: {
        issues: { addLabels: vi.fn(async () => ({})) },
        pulls: {
          create: vi.fn(async () => ({ data: { number: 101 } })),
          update: vi.fn(async () => ({})),
        },
      },
    }
    return { core, github, summary: () => summary }
  }

  function publish({ fakes, env = {}, push = vi.fn(async () => {}) }) {
    return runPublish({
      context: { repo: { owner: 'o', repo: 'r' } },
      core: fakes.core,
      env: {
        APP_TOKEN: 'app-token',
        GITHUB_WORKSPACE: '/w',
        IS_DEFAULT_INPUTS: 'true',
        PREPARED_FILE: path.join(preparedDir, 'prepared.json'),
        REF: 'main',
        STALE_PRS: '[]',
        ...env,
      },
      github: fakes.github,
      push,
    })
  }

  it('should only report in a dry run', async () => {
    await writePrepared({
      prs: [
        { prId: 'a', step: 'dry-run' },
        { prId: 'b', step: 'dry-run' },
      ],
    })
    const fakes = makeFakes()
    const push = vi.fn()

    await publish({ env: { APP_TOKEN: '', IS_DEFAULT_INPUTS: 'false' }, fakes, push })

    expect(push).not.toHaveBeenCalled()
    for (const group of Object.values(fakes.github.rest)) {
      for (const method of Object.values(group)) {
        expect(method).not.toHaveBeenCalled()
      }
    }
    expect(fakes.summary()).toContain('- a: dry-run\n')
    expect(fakes.summary()).toContain('- b: dry-run\n')
  })

  it('should publish the other PRs when one push fails, then fail the step once', async () => {
    await writePrepared({ prs: [{ prId: 'a' }, { prId: 'b' }] })
    const fakes = makeFakes()
    const push = vi.fn(async ({ entry }) => {
      if (entry.prId === 'a') {
        throw new Error('lease rejected')
      }
    })

    await publish({ fakes, push })

    expect(fakes.github.rest.pulls.create).toHaveBeenCalledTimes(1)
    expect(fakes.github.rest.pulls.create).toHaveBeenCalledWith(
      expect.objectContaining({ head: 'ci/audit-deps-fix-main-b' }),
    )
    expect(fakes.summary()).toContain('- a: failed: lease rejected\n')
    expect(fakes.summary()).toContain('- b: created #101\n')
    expect(fakes.core.setFailed).toHaveBeenCalledTimes(1)
    expect(fakes.core.setFailed).toHaveBeenCalledWith(FAIL_TEXT)
  })

  it('should open a backport PR against 3.x with the dependencies label', async () => {
    await writePrepared({ prs: [{ prId: 'a' }] })
    const fakes = makeFakes()

    await publish({ env: { REF: '3.x' }, fakes })

    expect(fakes.github.rest.pulls.create).toHaveBeenCalledWith(
      expect.objectContaining({ base: '3.x', head: 'ci/audit-deps-fix-main-a' }),
    )
    expect(fakes.github.rest.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 101,
      labels: ['dependencies'],
      owner: 'o',
      repo: 'r',
    })
  })

  it('should update an existing PR by number instead of creating one', async () => {
    await writePrepared({ prs: [{ headSha: 'old', prId: 'a', prNumber: 77, step: 'update' }] })
    const fakes = makeFakes()

    await publish({ fakes })

    expect(fakes.github.rest.pulls.update).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'body a', pull_number: 77 }),
    )
    expect(fakes.github.rest.pulls.create).not.toHaveBeenCalled()
  })

  it('should report a stale close failure and still write the summary', async () => {
    await writePrepared({ prs: [{ prId: 'a' }] })
    const fakes = makeFakes()
    fakes.github.rest.pulls.get = vi.fn(async () => {
      throw new Error('close boom')
    })
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {})

    await publish({ env: { STALE_PRS: '[12]' }, fakes })

    logger.mockRestore()
    expect(fakes.summary()).toContain('- a: created #101\n')
    expect(fakes.summary()).toContain('- stale: failed #12: close boom\n')
    expect(fakes.core.summary.write).toHaveBeenCalled()
    expect(fakes.core.setFailed).toHaveBeenCalledWith(FAIL_TEXT)
  })

  it('should only report in a real run without an App token', async () => {
    await writePrepared({ prs: [{ prId: 'a' }] })
    const fakes = makeFakes()
    const push = vi.fn()

    await publish({ env: { APP_TOKEN: '', STALE_PRS: '[12]' }, fakes, push })

    expect(push).not.toHaveBeenCalled()
    for (const group of Object.values(fakes.github.rest)) {
      for (const method of Object.values(group)) {
        expect(method).not.toHaveBeenCalled()
      }
    }
    expect(fakes.summary()).toContain('- a: not-published: App token missing\n')
    expect(fakes.core.setFailed).toHaveBeenCalledWith('App token missing; no PRs were published')
  })

  it('should list every PR step that was not prepared', async () => {
    await writePrepared({
      prs: [
        { headSha: 'h', prId: 'held', prNumber: 90, step: 'blocked' },
        { prId: 'rejected', step: 'skip-rejected' },
        { headSha: 'h', prId: 'same', prNumber: 95, step: 'skip' },
      ],
    })
    const fakes = makeFakes()
    const push = vi.fn()

    await publish({ fakes, push })

    const lines = fakes.summary().split('\n')
    expect(push).not.toHaveBeenCalled()
    expect(lines).toContain(
      '- held: blocked #90: a person pushed to this branch; the bot no longer updates it',
    )
    expect(lines).toContain('- same: skip #95: unchanged since the last run')
    expect(lines).toContain(
      '- rejected: skip-rejected: a person closed this change; it is not re-created',
    )
    expect(fakes.core.setFailed).not.toHaveBeenCalled()
  })

  it('should stop before it publishes when prepared.json is invalid', async () => {
    await writeFile(
      path.join(preparedDir, 'prepared.json'),
      JSON.stringify({
        prs: [{ branch: 'b', headSha: 'h', prId: 'a', prNumber: null, step: 'update' }],
      }),
    )
    const fakes = makeFakes()
    const push = vi.fn()

    await expect(publish({ fakes, push })).rejects.toThrow('an update needs a PR number')
    expect(push).not.toHaveBeenCalled()
  })
})

describe('pushBranch', () => {
  async function pushArgs({ entry }) {
    const core = { setSecret: vi.fn() }
    const execFile = vi.fn(async () => ({ stderr: '', stdout: '' }))
    await pushBranch({
      core,
      cwd: '/w',
      entry,
      execFile,
      owner: 'o',
      repo: 'r',
      token: 'secret-token',
    })
    const [command, args, options] = execFile.mock.calls[0]
    return { args, command, core, options }
  }

  const base = { branch: 'ci/audit-deps-fix-main-a', commit: 'c0ffee' }

  it.each([
    ['a create on no branch', { headSha: null, step: 'create' }, ''],
    ['a create on a leftover branch', { headSha: 'cafe', step: 'create' }, 'cafe'],
  ])('should lease %s', async (_name, entry, expectedHead) => {
    const { args } = await pushArgs({ entry: { ...base, ...entry } })

    expect(args).toContain(`--force-with-lease=refs/heads/ci/audit-deps-fix-main-a:${expectedHead}`)
  })

  it('should keep the token out of the arguments and mask the auth header', async () => {
    const { args, command, core, options } = await pushArgs({
      entry: { ...base, headSha: null, step: 'create' },
    })
    const basic = Buffer.from('x-access-token:secret-token').toString('base64')

    expect(command).toBe('git')
    expect(args.some((arg) => arg.includes('secret-token') || arg.includes(basic))).toBe(false)
    expect(options.env.GIT_CONFIG_VALUE_0).toBe(`AUTHORIZATION: basic ${basic}`)
    expect(core.setSecret).toHaveBeenCalledWith(basic)
  })

  it('should push with repo hooks turned off', async () => {
    const { args } = await pushArgs({ entry: { ...base, headSha: null, step: 'create' } })

    expect(args.slice(0, 3)).toEqual(['-c', 'core.hooksPath=/dev/null', 'push'])
  })
})
