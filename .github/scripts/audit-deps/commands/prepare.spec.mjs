import { execFile } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { readPrepared } from '../step-handoff.mjs'
import { runPreparePrs, spawnForExitCode } from './prepare.mjs'

const execFileAsync = promisify(execFile)
const BOT = 'github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>'

const UNCLEARED_ADVISORY = 'GHSA-cccc-dddd-eeee'

function bump({ id, dependency, advisories = ['GHSA-aaaa-bbbb-cccc'] }) {
  return {
    advisories,
    dependency,
    from: '^1.0.0',
    fromVersion: '1.0.0',
    id,
    isMajor: false,
    manifests: ['package.json'],
    to: '1.0.1',
  }
}

const plan = {
  bumps: [
    bump({ id: 'dep-a-1', dependency: 'dep-a' }),
    bump({ id: 'dep-b-1', dependency: 'dep-b' }),
    bump({ advisories: [UNCLEARED_ADVISORY], id: 'dep-c-1', dependency: 'dep-c' }),
    bump({ id: 'dep-d-1', dependency: 'dep-d' }),
  ],
  noFix: [],
  originDirs: {},
  prs: [
    {
      branch: 'ci/audit-deps-fix-main-non-major',
      bumpIds: ['dep-a-1'],
      id: 'non-major',
      kind: 'group',
    },
    {
      branch: 'ci/audit-deps-fix-main-dep-b-1',
      bumpIds: ['dep-b-1'],
      id: 'dep-b-1',
      kind: 'major',
    },
    {
      branch: 'ci/audit-deps-fix-main-dep-c-1',
      bumpIds: ['dep-c-1'],
      id: 'dep-c-1',
      kind: 'major',
    },
    {
      branch: 'ci/audit-deps-fix-main-dep-d-1',
      bumpIds: ['dep-d-1'],
      id: 'dep-d-1',
      kind: 'major',
    },
    {
      branch: 'ci/audit-deps-fix-main-skipped',
      bumpIds: ['dep-b-1'],
      id: 'skipped',
      kind: 'major',
    },
    { branch: 'feature/not-ours', bumpIds: ['dep-b-1'], id: 'bad-branch', kind: 'major' },
  ],
}

const prSteps = {
  'bad-branch': { headSha: null, prNumber: null, step: 'create' },
  'dep-b-1': { headSha: null, prNumber: null, step: 'create' },
  'dep-c-1': { headSha: null, prNumber: null, step: 'create' },
  'dep-d-1': { headSha: null, prNumber: null, step: 'create' },
  'non-major': { headSha: null, prNumber: null, step: 'create' },
  skipped: { headSha: 'abc', prNumber: 95, step: 'skip' },
}

describe('runPreparePrs', () => {
  let repoDir
  let outDir
  let baseSha
  let prepared
  const auditCalls = []

  async function git(...args) {
    const { stdout } = await execFileAsync('git', args, { cwd: repoDir })
    return stdout.trim()
  }

  beforeAll(async () => {
    repoDir = await mkdtemp(path.join(tmpdir(), 'prepare-repo-'))
    outDir = await mkdtemp(path.join(tmpdir(), 'prepare-out-'))
    const emptyConfig = path.join(outDir, 'gitconfig')
    await writeFile(emptyConfig, '')
    vi.stubEnv('GIT_CONFIG_GLOBAL', emptyConfig)
    vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1')
    vi.stubEnv('GITHUB_STEP_SUMMARY', '')

    await writeFile(
      path.join(repoDir, 'package.json'),
      `${JSON.stringify({ dependencies: { 'dep-a': '^1.0.0', 'dep-b': '^1.0.0', 'dep-c': '^1.0.0', 'dep-d': '^1.0.0' } }, null, 2)}\n`,
    )
    await writeFile(path.join(repoDir, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\n")
    await writeFile(path.join(repoDir, '.gitignore'), 'ignored/\n')
    await git('init', '-q', '-b', 'main')
    await git('add', 'package.json', 'pnpm-lock.yaml', '.gitignore')
    await execFileAsync(
      'git',
      ['-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'init'],
      {
        cwd: repoDir,
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: '2020-01-02T03:04:05Z',
          GIT_COMMITTER_DATE: '2020-01-02T03:04:05Z',
        },
      },
    )
    baseSha = await git('rev-parse', 'HEAD')
    const failingHook = path.join(repoDir, '.git', 'hooks', 'pre-commit')
    await writeFile(failingHook, '#!/bin/sh\nexit 1\n')
    await chmod(failingHook, 0o755)

    const planFile = path.join(outDir, 'plan.json')
    await writeFile(planFile, JSON.stringify(plan))

    let lockfileCalls = 0
    const run = async ({ args, command, cwd, env }) => {
      if (command === 'pnpm') {
        lockfileCalls++
        if (lockfileCalls === 1) {
          await writeFile(path.join(cwd, 'stray.txt'), 'left behind')
          await mkdir(path.join(cwd, 'ignored'))
          await writeFile(path.join(cwd, 'ignored', 'cache.txt'), 'kept by clean -fd')
          return 1
        }
        await writeFile(
          path.join(cwd, 'pnpm-lock.yaml'),
          `lockfileVersion: '9.0'\n# ${lockfileCalls}\n`,
        )
        return 0
      }
      auditCalls.push({ args, command, cwd })
      const findings = env.INPUT_JSON.endsWith('reaudit-dep-c-1.json')
        ? [{ advisory: UNCLEARED_ADVISORY, bumps: [{ dependency: 'dep-c' }] }]
        : []
      await writeFile(env.INPUT_JSON, JSON.stringify({ findings, plan: { actions: [] } }))
      // The audit exits 1 when its result may be incomplete, even if it wrote a report.
      return env.INPUT_JSON.endsWith('reaudit-dep-d-1.json') ? 1 : 0
    }

    await runPreparePrs({
      options: {
        cwd: repoDir,
        'out-dir': outDir,
        plan: planFile,
        'pr-steps-json': JSON.stringify(prSteps),
        ref: 'main',
        'run-url': 'https://github.com/o/r/actions/runs/1',
        scope: 'monorepo',
        severity: 'moderate',
      },
      renderPr: async () => ({ body: 'b', isDraft: false, title: 't' }),
      run,
    })
    prepared = await readPrepared({ file: path.join(outDir, 'prepared.json') })
  })

  afterAll(async () => {
    vi.unstubAllEnvs()
    await rm(repoDir, { force: true, recursive: true })
    await rm(outDir, { force: true, recursive: true })
  })

  function entryFor(prId) {
    return prepared.find((entry) => entry.prId === prId)
  }

  it('should record the failed step and keep going', () => {
    expect(entryFor('non-major')).toMatchObject({ failedStep: 'lockfile' })
  })

  // The repo has a failing pre-commit hook, and the failed PR before this one left an ignored file.
  it('should commit only the manifest and lockfile as the bot on top of the base', async () => {
    const { commit, reason } = entryFor('dep-b-1')

    expect(reason).toBeUndefined()
    const files = await git('diff', '--name-only', baseSha, commit)

    expect(files.split('\n').sort()).toEqual(['package.json', 'pnpm-lock.yaml'])
    expect(await git('rev-parse', `${commit}^`)).toBe(baseSha)
    expect(await git('log', '-1', '--format=%an <%ae>', commit)).toBe(BOT)
  })

  it('should not carry the failed PR manifest edit into the next PR', async () => {
    const manifest = JSON.parse(await git('show', `${entryFor('dep-b-1').commit}:package.json`))

    expect(manifest.dependencies['dep-a']).toBe('^1.0.0')
  })

  it('should fail a PR whose bumped dependency still reports its advisory', () => {
    expect(entryFor('dep-c-1')).toMatchObject({
      failedStep: 're-audit',
      reason: expect.stringContaining(UNCLEARED_ADVISORY),
    })
  })

  it('should fail a PR whose re-audit reports an incomplete result', () => {
    expect(entryFor('dep-d-1')).toMatchObject({
      failedStep: 're-audit',
      reason: 're-audit exited 1',
    })
  })

  // A rerun on the same base with the same changes then gives the same commit, so its push is a
  // no-op and starts no CI run.
  it('should date the commit with the base commit date', async () => {
    const { commit } = entryFor('dep-b-1')
    const baseDate = await git('log', '-1', '--format=%cI', baseSha)

    expect(await git('log', '-1', '--format=%aI %cI', commit)).toBe(`${baseDate} ${baseDate}`)
  })

  it('should re-audit the audited tree with the action from the tooling checkout', () => {
    const toolingAction = fileURLToPath(
      new URL('../../../actions/audit-dependencies/dist/index.js', import.meta.url),
    )

    expect(auditCalls.length).toBeGreaterThan(0)
    for (const call of auditCalls) {
      expect(call).toEqual({ args: [toolingAction], command: 'node', cwd: repoDir })
    }
  })

  it('should record a PR whose step is not prepared without building it', () => {
    expect(prepared.map((entry) => entry.prId)).toEqual([
      'non-major',
      'dep-b-1',
      'dep-c-1',
      'dep-d-1',
      'skipped',
      'bad-branch',
    ])
    expect(entryFor('skipped')).toEqual({
      branch: 'ci/audit-deps-fix-main-skipped',
      headSha: 'abc',
      prId: 'skipped',
      prNumber: 95,
      step: 'skip',
    })
  })

  it('should refuse a branch outside the bot prefix', () => {
    expect(entryFor('bad-branch')).toMatchObject({ failedStep: 'branch' })
  })
})

describe('runPreparePrs on a dirty tree', () => {
  let repoDir

  afterEach(async () => {
    vi.unstubAllEnvs()
    await rm(repoDir, { force: true, recursive: true })
  })

  it('should stop before it touches uncommitted work', async () => {
    vi.stubEnv('GIT_CONFIG_GLOBAL', '/dev/null')
    vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1')
    repoDir = await mkdtemp(path.join(tmpdir(), 'prepare-dirty-'))
    await execFileAsync('git', ['init', '-q', '-b', 'main'], { cwd: repoDir })
    await execFileAsync(
      'git',
      [
        '-c',
        'user.name=t',
        '-c',
        'user.email=t@example.com',
        'commit',
        '-q',
        '--allow-empty',
        '-m',
        'init',
      ],
      { cwd: repoDir },
    )
    await writeFile(path.join(repoDir, 'work.txt'), 'unsaved')
    const planFile = path.join(repoDir, '..', `${path.basename(repoDir)}-plan.json`)
    await writeFile(planFile, JSON.stringify(plan))

    await expect(
      runPreparePrs({
        options: {
          cwd: repoDir,
          'out-dir': `${repoDir}-out`,
          plan: planFile,
          'pr-steps-json': JSON.stringify(prSteps),
          ref: 'main',
          'run-url': 'u',
          scope: 'monorepo',
          severity: 'moderate',
        },
        renderPr: vi.fn(),
        run: vi.fn(),
      }),
    ).rejects.toThrow('needs a clean working tree')
    expect(await readFile(path.join(repoDir, 'work.txt'), 'utf8')).toBe('unsaved')
    await rm(planFile, { force: true })
    await rm(`${repoDir}-out`, { force: true, recursive: true })
  })
})

describe('spawnForExitCode', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should not pass GITHUB_TOKEN to the child', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'secret')

    const code = await spawnForExitCode({
      args: ['-e', 'process.exit(process.env.GITHUB_TOKEN ? 3 : 0)'],
      command: process.execPath,
      cwd: tmpdir(),
    })

    expect(code).toBe(0)
  })
})
