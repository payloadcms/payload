import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const CLI = path.join(import.meta.dirname, 'cli.mjs')
const ZERO_WIDTH_SPACE = '​'
const MANIFEST = 'packages/ui/package.json'
const DAY_MS = 24 * 60 * 60 * 1000

const GHSA_PAD = 'GHSA-cccc-ffff-gggg'
const GHSA_CSV_MAJOR = 'GHSA-hhhh-jjjj-mmmm'
const GHSA_CSV_MINOR = 'GHSA-2222-3333-4444'
const GHSA_ZOD = 'GHSA-pppp-qqqq-rrrr'
const GHSA_NONE = 'GHSA-vvvv-wwww-xxxx'

const fixEntry = ({ dependency, currentSpec, version, fromMajor }) => ({
  currentSpec,
  dependency,
  fix: { fromMajor, status: 'fix', version },
  workspacePackages: ['ui'],
})

const finding = ({ advisory, bumps }) => ({
  advisory,
  bumps,
  originPackages: ['ui'],
  package: bumps[0].dependency,
  paths: [],
  severity: 'high',
  title: 'Bad thing',
})

const padFinding = () =>
  finding({
    advisory: GHSA_PAD,
    bumps: [
      fixEntry({ dependency: 'left-pad', currentSpec: '1.0.0', version: '1.0.1', fromMajor: 1 }),
    ],
  })

const makeReport = ({ findings }) => ({
  findings,
  plan: {
    actions: ['csv-parse', 'left-pad', 'zod'].map((dependency) => ({
      dependency,
      manifests: [MANIFEST],
      type: 'bump',
    })),
    scope: 'consumer-facing',
    verify: 'pnpm audit',
  },
})

// Bumps: csv-parse-7 (major), csv-parse-5-fallback, left-pad-1, zod-3 (catalog). Units: non-major, csv-parse-7.
const fullReport = () =>
  makeReport({
    findings: [
      padFinding(),
      finding({
        advisory: GHSA_CSV_MAJOR,
        bumps: [
          fixEntry({
            dependency: 'csv-parse',
            currentSpec: '5.6.0',
            version: '7.0.2',
            fromMajor: 5,
          }),
        ],
      }),
      finding({
        advisory: GHSA_CSV_MINOR,
        bumps: [
          fixEntry({
            dependency: 'csv-parse',
            currentSpec: '5.6.0',
            version: '5.6.1',
            fromMajor: 5,
          }),
        ],
      }),
      finding({
        advisory: GHSA_ZOD,
        bumps: [
          fixEntry({ dependency: 'zod', currentSpec: 'catalog:', version: '3.25.0', fromMajor: 3 }),
        ],
      }),
      {
        advisory: GHSA_NONE,
        bumps: [{ currentSpec: '1.0.0', dependency: 'old-lib', fix: { status: 'none' } }],
        originPackages: ['ui'],
        package: 'old-lib',
        paths: [],
        severity: 'high',
      },
    ],
  })

const storeEntry = ({
  dependency,
  to,
  outcome = 'declined',
  reason = 'needs node 26',
  ageDays = 1,
}) => ({
  at: new Date(Date.now() - ageDays * DAY_MS).toISOString(),
  dependency,
  outcome,
  reason,
  ref: 'main',
  to,
})

const research = ({ decision = 'apply', reason = '' } = {}) => ({
  breakingChanges: [],
  decision,
  filesChecked: ['packages/ui/src/index.ts'],
  reason,
})

describe('cli', () => {
  let dir
  let outputFile
  let summaryFile
  let fixturesFile
  let researchDir
  let verifyDir

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'audit-deps-cli-'))
    outputFile = path.join(dir, '.out', 'output')
    summaryFile = path.join(dir, '.out', 'summary')
    fixturesFile = path.join(dir, '.out', 'fixtures.json')
    researchDir = path.join(dir, '.out', 'research')
    verifyDir = path.join(dir, '.out', 'verify')
    await mkdir(researchDir, { recursive: true })
    await mkdir(verifyDir, { recursive: true })
    await writeFile(fixturesFile, '{}')
  })

  afterEach(async () => {
    await rm(dir, { force: true, recursive: true })
  })

  const run = async ({ args }) => {
    const env = {
      ...process.env,
      AUDIT_DEPS_FETCH_FIXTURES: fixturesFile,
      GITHUB_OUTPUT: outputFile,
      GITHUB_REPOSITORY: 'payloadcms/payload',
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_STEP_SUMMARY: summaryFile,
    }
    delete env.GITHUB_TOKEN

    try {
      const { stdout } = await execFileAsync('node', [CLI, ...args], { cwd: dir, env })
      return { code: 0, stdout }
    } catch (error) {
      return { code: error.code, stdout: error.stdout }
    }
  }

  const readOutputs = async () => {
    const text = await readFile(outputFile, 'utf8')
    return Object.fromEntries(
      text
        .split('\n')
        .filter(Boolean)
        .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
    )
  }

  const outFile = (name) => path.join(dir, '.out', name)

  const writeJson = async ({ name, value }) => {
    const file = outFile(name)
    await writeFile(file, JSON.stringify(value))
    return file
  }

  const writeResearch = ({ bumpId, value }) =>
    writeFile(path.join(researchDir, `${bumpId}.json`), JSON.stringify(value))

  const git = (args) => execFileAsync('git', args, { cwd: dir })

  const initRepo = async () => {
    await mkdir(path.join(dir, 'packages/ui'), { recursive: true })
    await writeFile(
      path.join(dir, MANIFEST),
      JSON.stringify(
        {
          name: '@payloadcms/ui',
          dependencies: { 'csv-parse': '5.6.0', 'left-pad': '1.0.0', zod: 'catalog:' },
        },
        null,
        2,
      ),
    )
    await writeFile(
      path.join(dir, 'pnpm-workspace.yaml'),
      'packages:\n  - packages/*\ncatalog:\n  zod: ^3.22.0\n',
    )
    await writeFile(path.join(dir, '.gitignore'), '.out/\n')
    await git(['init', '-q'])
    await git(['config', 'user.email', 'a@b.c'])
    await git(['config', 'user.name', 'x'])
    await git(['add', '.'])
    await git(['commit', '-qm', 'pin left-pad to avoid a broken minor'])
  }

  // Clears outputs and summary by default so later assertions see only the command under test.
  const makePlan = async ({
    report: reportValue = fullReport(),
    storeEntries = [],
    ref = 'main',
    shouldKeepOutputs = false,
  } = {}) => {
    const report = await writeJson({ name: 'report.json', value: reportValue })
    const store = await writeJson({ name: 'store.json', value: { entries: storeEntries } })
    const out = outFile('plan.json')

    const result = await run({
      args: [
        'plan',
        `--report=${report}`,
        '--scope=consumer-facing',
        `--ref=${ref}`,
        `--store=${store}`,
        `--cwd=${dir}`,
        `--out=${out}`,
      ],
    })
    if (!shouldKeepOutputs) {
      await rm(outputFile, { force: true })
      await rm(summaryFile, { force: true })
    }

    return { ...result, plan: out }
  }

  const readPlan = async ({ plan }) => JSON.parse(await readFile(plan, 'utf8'))

  it('exits 1 with an escaped ::error:: on any thrown error', async () => {
    const { code, stdout } = await run({
      args: [
        'plan',
        '--report=/nope%\n.json',
        '--scope=consumer-facing',
        '--ref=main',
        '--store=/nope',
        '--out=/nope',
      ],
    })

    expect(code).toBe(1)
    expect(stdout).toMatch(/^::error::.*%25.*%0A/)
    expect(stdout.trim().split('\n')).toHaveLength(1)
  })

  it('exits 1 on an unknown command', async () => {
    const { code, stdout } = await run({ args: ['summarize'] })

    expect(code).toBe(1)
    expect(stdout).toContain('::error::unknown command: summarize')
  })

  describe('plan', () => {
    it('writes bumps, units, no-fix, research, stored, and origin dirs', async () => {
      await initRepo()

      const { code, plan } = await makePlan({
        shouldKeepOutputs: true,
        storeEntries: [
          storeEntry({ dependency: 'left-pad', to: '1.0.1', reason: 'bad <!-- x --> @bob' }),
        ],
      })

      const value = await readPlan({ plan })
      expect(code).toBe(0)
      expect(value.bumps.map((bump) => bump.id)).toEqual([
        'csv-parse-5-fallback',
        'csv-parse-7',
        'left-pad-1',
        'zod-3',
      ])
      expect(value.units.map((unit) => [unit.id, unit.bumpIds])).toEqual([
        ['non-major', ['csv-parse-5-fallback', 'left-pad-1', 'zod-3']],
        ['csv-parse-7', ['csv-parse-7']],
      ])
      expect(value.noFix.map((item) => item.advisory)).toEqual([GHSA_NONE])
      expect(value.research).toEqual(['csv-parse-5-fallback', 'csv-parse-7', 'zod-3'])
      expect(value.stored.map((entry) => entry.dependency)).toEqual(['left-pad'])
      expect(value.originDirs['csv-parse-7']).toEqual(['ui'])
      expect(await readOutputs()).toEqual({ has_findings: 'true' })
    })

    it('resolves fromVersion for catalog specs from pnpm-workspace.yaml', async () => {
      await initRepo()

      const { plan } = await makePlan()

      const zod = (await readPlan({ plan })).bumps.find((bump) => bump.id === 'zod-3')
      expect(zod).toMatchObject({ from: 'catalog:', fromVersion: '3.22.0' })
    })

    it('lists stored outcomes and no-fix advisories in the summary, sanitized', async () => {
      await initRepo()

      await makePlan({
        shouldKeepOutputs: true,
        storeEntries: [
          storeEntry({
            dependency: 'left-pad',
            to: '1.0.1',
            outcome: 'declined<!-- y -->',
            reason: 'bad <!-- x --> @bob',
          }),
        ],
      })

      const summary = await readFile(summaryFile, 'utf8')
      expect(summary).toContain('left-pad 1.0.1: declined on ')
      expect(summary).toContain(`@${ZERO_WIDTH_SPACE}bob`)
      expect(summary).not.toContain('<!--')
      expect(summary).toContain(`${GHSA_NONE} (high) in old-lib: No old-lib release fixes it.`)
    })
  })

  describe('evidence', () => {
    const runEvidence = async ({ bumpId }) => {
      const { plan } = await makePlan()
      const outDir = outFile(`evidence-${bumpId}`)
      const result = await run({
        args: [
          'evidence',
          `--plan=${plan}`,
          `--bump=${bumpId}`,
          `--cwd=${dir}`,
          `--out-dir=${outDir}`,
        ],
      })
      const read = (name) => readFile(path.join(outDir, name), 'utf8')

      return { ...result, read }
    }

    it('writes empty notes and the pin history for a non-major', async () => {
      await initRepo()

      const { code, read } = await runEvidence({ bumpId: 'left-pad-1' })

      expect(code).toBe(0)
      expect(await read('notes.md')).toBe('')
      expect(JSON.parse(await read('evidence.json'))).toEqual({ hasNotes: false })
      const history = await read('pin-history.txt')
      expect(history).toContain('pin left-pad to avoid a broken minor')
      expect(history).toContain('"left-pad": "1.0.0"')
    })

    it('reads the catalog line for a catalog spec', async () => {
      await initRepo()

      const { read } = await runEvidence({ bumpId: 'zod-3' })

      expect(await read('pin-history.txt')).toContain('zod: ^3.22.0')
    })

    it('prefers the dependencies line over other sections', async () => {
      await initRepo()
      await writeFile(
        path.join(dir, MANIFEST),
        JSON.stringify(
          {
            name: '@payloadcms/ui',
            peerDependencies: { 'left-pad': '^1.0.0' },
            dependencies: { 'csv-parse': '5.6.0', 'left-pad': '1.0.0', zod: 'catalog:' },
          },
          null,
          2,
        ),
      )
      await git(['commit', '-qam', 'add peer'])

      const { read } = await runEvidence({ bumpId: 'left-pad-1' })

      expect(await read('pin-history.txt')).toMatch(/^## packages\/ui\/package\.json:8\n/)
    })

    it('cuts the pin history to 20,000 characters including the cut note', async () => {
      await initRepo()
      const messageFile = outFile('message.txt')
      await writeFile(messageFile, `pin\n\n${'long line of history\n'.repeat(2000)}`)
      await git(['commit', '-q', '--amend', '-F', messageFile])

      const { read } = await runEvidence({ bumpId: 'left-pad-1' })

      const history = await read('pin-history.txt')
      expect(history.length).toBeLessThanOrEqual(20000)
      expect(history.endsWith('… cut at 20000 characters\n')).toBe(true)
    })

    it('writes release notes and no pin history for a major', async () => {
      await initRepo()
      const repoApi = 'https://api.github.com/repos/adaltas/node-csv'
      await writeFile(
        fixturesFile,
        JSON.stringify({
          'https://registry.npmjs.org/csv-parse': {
            status: 200,
            body: {
              repository: { url: 'git+https://github.com/adaltas/node-csv.git' },
              versions: { '5.6.0': {}, '6.0.0': {}, '7.0.0': {}, '7.0.2': {} },
            },
          },
          [`${repoApi}/git/ref/tags/v7.0.0`]: { status: 200, body: {} },
          [`${repoApi}/releases/tags/v7.0.0`]: {
            status: 200,
            body: { body: 'Drops the columns option.', html_url: 'https://github.com/r/7' },
          },
        }),
      )

      const { code, read } = await runEvidence({ bumpId: 'csv-parse-7' })

      expect(code).toBe(0)
      expect(await read('notes.md')).toContain(
        '## 7.0.0 (https://github.com/r/7)\n\nDrops the columns option.',
      )
      expect(JSON.parse(await read('evidence.json'))).toEqual({ hasNotes: true })
      expect(await read('pin-history.txt')).toBe('Not applicable: major bump.\n')
    })
  })

  it('build-research-prompt fills the template from the evidence dir', async () => {
    await initRepo()
    const { plan } = await makePlan()
    const evidenceDir = outFile('evidence')
    await mkdir(evidenceDir)
    await writeFile(path.join(evidenceDir, 'evidence.json'), '{"hasNotes":false}')
    const template = outFile('prompt.md')
    const skill = outFile('skill.md')
    await writeFile(template, '{{ref}} {{dependency}} {{from}} {{evidenceMode}} {{notesPath}}')
    await writeFile(skill, '---\nname: x\n---\nSKILL')
    const out = outFile('prompt.out.md')

    const { code } = await run({
      args: [
        'build-research-prompt',
        `--plan=${plan}`,
        '--bump=zod-3',
        `--template=${template}`,
        `--skill=${skill}`,
        `--evidence-dir=${evidenceDir}`,
        '--ref=main',
        `--out=${out}`,
      ],
    })

    expect(code).toBe(0)
    const prompt = await readFile(out, 'utf8')
    expect(prompt).toContain(`main zod 3.22.0 package diff ${path.join(evidenceDir, 'notes.md')}`)
    expect(prompt).toContain('SKILL')
  })

  describe('check-research', () => {
    it('exits 0 for a valid result', async () => {
      const result = await writeJson({ name: 'result.json', value: research() })

      expect((await run({ args: ['check-research', `--result=${result}`] })).code).toBe(0)
    })

    it('exits 1 for an invalid result', async () => {
      const result = await writeJson({ name: 'result.json', value: { decision: 'apply' } })

      const { code, stdout } = await run({ args: ['check-research', `--result=${result}`] })

      expect(code).toBe(1)
      expect(stdout).toContain('::error::codex result is missing required fields')
    })
  })

  describe('select-bumps', () => {
    const selectBumps = async ({ plan, unit }) => {
      const { code } = await run({
        args: ['select-bumps', `--plan=${plan}`, `--unit=${unit}`, `--research-dir=${researchDir}`],
      })
      const outputs = await readOutputs()
      await rm(outputFile, { force: true })

      return { bumpIds: JSON.parse(outputs.bump_ids), code }
    }

    it('adds the fallback to the group when the major is declined', async () => {
      await initRepo()
      const { plan } = await makePlan({
        storeEntries: [storeEntry({ dependency: 'zod', to: '3.25.0' })],
      })
      await writeResearch({
        bumpId: 'csv-parse-7',
        value: research({ decision: 'decline', reason: 'x' }),
      })
      await writeResearch({ bumpId: 'csv-parse-5-fallback', value: research() })
      await writeResearch({ bumpId: 'left-pad-1', value: research() })

      expect(await selectBumps({ plan, unit: 'non-major' })).toEqual({
        bumpIds: ['csv-parse-5-fallback', 'left-pad-1'],
        code: 0,
      })
      expect((await selectBumps({ plan, unit: 'csv-parse-7' })).bumpIds).toEqual([])
    })

    it('treats a stored major as declined', async () => {
      await initRepo()
      const { plan } = await makePlan({
        storeEntries: [storeEntry({ dependency: 'csv-parse', to: '7.0.2' })],
      })
      await writeResearch({ bumpId: 'csv-parse-5-fallback', value: research() })

      expect((await selectBumps({ plan, unit: 'non-major' })).bumpIds).toEqual([
        'csv-parse-5-fallback',
      ])
    })

    it('keeps the fallback out when the major applies', async () => {
      await initRepo()
      const { plan } = await makePlan()
      await writeResearch({ bumpId: 'csv-parse-7', value: research() })
      await writeResearch({ bumpId: 'csv-parse-5-fallback', value: research() })
      await writeFile(path.join(researchDir, 'zod-3.json'), 'not json')

      expect((await selectBumps({ plan, unit: 'non-major' })).bumpIds).toEqual([])
      expect((await selectBumps({ plan, unit: 'csv-parse-7' })).bumpIds).toEqual(['csv-parse-7'])
    })
  })

  describe('apply-bumps', () => {
    it('edits the manifest', async () => {
      await initRepo()
      const { plan } = await makePlan()

      const { code } = await run({
        args: ['apply-bumps', `--plan=${plan}`, '--bump-ids=["left-pad-1"]', `--cwd=${dir}`],
      })

      expect(code).toBe(0)
      expect(
        JSON.parse(await readFile(path.join(dir, MANIFEST), 'utf8')).dependencies['left-pad'],
      ).toBe('1.0.1')
    })

    it('exits 1 on an unsupported specifier', async () => {
      await initRepo()
      const { plan } = await makePlan()
      const manifest = await readFile(path.join(dir, MANIFEST), 'utf8')
      await writeFile(path.join(dir, MANIFEST), manifest.replace('"1.0.0"', '">=1.0.0"'))

      const { code, stdout } = await run({
        args: ['apply-bumps', `--plan=${plan}`, '--bump-ids=["left-pad-1"]', `--cwd=${dir}`],
      })

      expect(code).toBe(1)
      expect(stdout).toBe(
        '::error::Unsupported dependency specifier ">=1.0.0"; only exact, ^ and ~ ranges can be bumped.\n',
      )
    })
  })

  describe('pr-body', () => {
    const runPrBody = async ({
      plan,
      unit,
      bumpIds,
      ref = 'main',
      reaudit = makeReport({ findings: [] }),
    }) => {
      const report = await writeJson({ name: 'reaudit.json', value: reaudit })
      const out = outFile('body.md')
      const result = await run({
        args: [
          'pr-body',
          `--plan=${plan}`,
          `--unit=${unit}`,
          `--bump-ids=${JSON.stringify(bumpIds)}`,
          `--report=${report}`,
          `--research-dir=${researchDir}`,
          '--scope=consumer-facing',
          '--severity=high',
          `--ref=${ref}`,
          '--run-url=https://github.com/payloadcms/payload/actions/runs/1',
          `--cwd=${dir}`,
          `--out=${out}`,
        ],
      })

      return { ...result, body: result.code === 0 ? await readFile(out, 'utf8') : '' }
    }

    it('renders a group body with advisories, affects, and a group title', async () => {
      await initRepo()
      const { plan } = await makePlan()
      await writeResearch({ bumpId: 'left-pad-1', value: research() })
      await writeResearch({ bumpId: 'zod-3', value: research() })
      await writeFile(
        fixturesFile,
        JSON.stringify({
          [`https://api.github.com/advisories/${GHSA_PAD}`]: {
            status: 200,
            body: {
              description: 'Long <!-- hidden --> text',
              severity: 'high',
              summary: 'Pad overflow by @eve',
            },
          },
        }),
      )

      const { body, code } = await runPrBody({
        plan,
        unit: 'non-major',
        bumpIds: ['left-pad-1', 'zod-3'],
      })

      expect(code).toBe(0)
      expect(body).toContain('This PR fixes 2 advisories (consumer-facing, high+).')
      expect(body).toContain(
        '[@payloadcms/ui](https://github.com/payloadcms/payload/tree/main/packages/ui)',
      )
      expect(body).toContain(`### left-pad: Pad overflow by @${ZERO_WIDTH_SPACE}eve`)
      expect(body).toContain('<summary>Changes checked</summary>')
      expect(body).toContain('`3.22.0` → `3.25.0`')
      expect(body.match(/<!--/g)).toHaveLength(1)
      expect(await readOutputs()).toEqual({
        is_draft: 'false',
        title: 'fix(deps): bump the non-major group with 2 updates',
      })
    })

    it('marks a partly fixed advisory from the re-audit', async () => {
      await initRepo()
      const { plan } = await makePlan()
      await writeResearch({ bumpId: 'left-pad-1', value: research() })
      const reaudit = makeReport({
        findings: [
          finding({
            advisory: GHSA_PAD,
            bumps: [
              fixEntry({
                dependency: 'other',
                currentSpec: '1.0.0',
                version: '2.0.0',
                fromMajor: 1,
              }),
            ],
          }),
        ],
      })

      const { body } = await runPrBody({
        plan,
        unit: 'non-major',
        bumpIds: ['left-pad-1'],
        reaudit,
      })

      expect(body).toContain(
        'This PR fixes 0 advisories (consumer-facing, high+). 1 more is partly fixed.',
      )
    })

    it('renders a draft major with a version title on 3.x', async () => {
      await initRepo()
      const { plan } = await makePlan({ ref: '3.x' })
      await writeResearch({ bumpId: 'csv-parse-7', value: research() })

      const { body, code } = await runPrBody({
        plan,
        unit: 'csv-parse-7',
        bumpIds: ['csv-parse-7'],
        ref: '3.x',
      })

      expect(code).toBe(0)
      expect(body.startsWith('No release notes found for 7.x.')).toBe(true)
      expect(await readOutputs()).toEqual({
        is_draft: 'true',
        title: 'fix(deps): bump csv-parse from 5.6.0 to 7.0.2 (3.x)',
      })
    })

    it('exits 1 for a bump outside the unit', async () => {
      await initRepo()
      const { plan } = await makePlan()

      const { code, stdout } = await runPrBody({
        plan,
        unit: 'csv-parse-7',
        bumpIds: ['left-pad-1'],
      })

      expect(code).toBe(1)
      expect(stdout).toContain('::error::bump left-pad-1 is not in unit csv-parse-7')
    })
  })

  describe('check-cleared', () => {
    const checkCleared = async ({ plan, reaudit }) => {
      const report = await writeJson({ name: 'reaudit.json', value: reaudit })

      return run({
        args: [
          'check-cleared',
          `--plan=${plan}`,
          '--bump-ids=["left-pad-1","zod-3"]',
          `--report=${report}`,
        ],
      })
    }

    it('exits 1 and lists bumps the re-audit still reports', async () => {
      await initRepo()
      const { plan } = await makePlan()

      const { code, stdout } = await checkCleared({
        plan,
        reaudit: makeReport({ findings: [padFinding()] }),
      })

      expect(code).toBe(1)
      expect(stdout).toBe('::error::left-pad-1: advisory still reported through left-pad\n')
    })

    it('exits 0 when every bump cleared its advisories', async () => {
      await initRepo()
      const { plan } = await makePlan()

      expect((await checkCleared({ plan, reaudit: makeReport({ findings: [] }) })).code).toBe(0)
    })
  })

  it('store-update prunes, then merges declines and verify failures', async () => {
    await initRepo()
    const kept = storeEntry({ dependency: 'zod', to: '3.25.0' })
    const expired = storeEntry({ dependency: 'left-pad', to: '1.0.0', ageDays: 40 })
    const { plan } = await makePlan({ storeEntries: [kept, expired] })
    const store = outFile('store.json')
    await writeResearch({
      bumpId: 'csv-parse-7',
      value: research({ decision: 'decline', reason: 'uses columns' }),
    })
    await writeResearch({ bumpId: 'csv-parse-5-fallback', value: research() })
    await writeResearch({ bumpId: 'left-pad-1', value: research() })
    await writeFile(
      path.join(verifyDir, 'non-major.json'),
      JSON.stringify({
        failed: [{ bumpId: 'left-pad-1', step: 'build' }],
        passed: ['csv-parse-5-fallback'],
      }),
    )
    const out = outFile('store.next.json')

    const { code } = await run({
      args: [
        'store-update',
        `--store=${store}`,
        `--plan=${plan}`,
        `--research-dir=${researchDir}`,
        `--verify-dir=${verifyDir}`,
        '--ref=main',
        `--out=${out}`,
      ],
    })

    expect(code).toBe(0)
    const { entries } = JSON.parse(await readFile(out, 'utf8'))
    const summary = entries.map(({ dependency, outcome, reason, ref, to }) => ({
      dependency,
      outcome,
      reason,
      ref,
      to,
    }))
    expect(summary).toEqual([
      {
        dependency: 'zod',
        outcome: 'declined',
        reason: 'needs node 26',
        ref: 'main',
        to: '3.25.0',
      },
      {
        dependency: 'csv-parse',
        outcome: 'declined',
        reason: 'uses columns',
        ref: 'main',
        to: '7.0.2',
      },
      {
        dependency: 'left-pad',
        outcome: 'failed',
        reason: 'failed at build',
        ref: 'main',
        to: '1.0.1',
      },
    ])
  })

  it('store-update skips verify failures at the lockfile and install steps', async () => {
    await initRepo()
    const { plan } = await makePlan()
    await writeFile(
      path.join(verifyDir, 'non-major.json'),
      JSON.stringify({
        failed: [
          { bumpId: 'csv-parse-5-fallback', step: 'lockfile' },
          { bumpId: 'left-pad-1', step: 'install' },
        ],
        passed: [],
      }),
    )
    const out = outFile('store.next.json')

    const { code } = await run({
      args: [
        'store-update',
        `--store=${outFile('missing-store.json')}`,
        `--plan=${plan}`,
        `--research-dir=${researchDir}`,
        `--verify-dir=${verifyDir}`,
        '--ref=main',
        `--out=${out}`,
      ],
    })

    expect(code).toBe(0)
    expect(JSON.parse(await readFile(out, 'utf8')).entries).toEqual([])
  })

  it('store-update drops verify ids outside the unit and renames odd step names', async () => {
    await initRepo()
    const { plan } = await makePlan()
    await writeFile(
      path.join(verifyDir, 'non-major.json'),
      JSON.stringify({
        failed: [
          { bumpId: 'csv-parse-7', step: 'build' },
          { bumpId: 'left-pad-1', step: 'build\n::warning::forged' },
        ],
        passed: [],
      }),
    )
    const out = outFile('store.next.json')

    await run({
      args: [
        'store-update',
        `--store=${outFile('missing-store.json')}`,
        `--plan=${plan}`,
        `--research-dir=${researchDir}`,
        `--verify-dir=${verifyDir}`,
        '--ref=main',
        `--out=${out}`,
      ],
    })

    const { entries } = JSON.parse(await readFile(out, 'utf8'))
    expect(entries.map(({ dependency, reason }) => [dependency, reason])).toEqual([
      ['left-pad', 'failed at verify'],
    ])
  })

  it('exits 1 when an output value contains a line break', async () => {
    await initRepo()
    const { plan } = await makePlan({
      report: makeReport({
        findings: [
          finding({
            advisory: GHSA_CSV_MAJOR,
            bumps: [
              fixEntry({
                dependency: 'evil\nname',
                currentSpec: '1.0.0',
                version: '2.0.0',
                fromMajor: 1,
              }),
            ],
          }),
        ],
      }),
    })
    const report = await writeJson({ name: 'reaudit.json', value: makeReport({ findings: [] }) })

    const { code, stdout } = await run({
      args: [
        'pr-body',
        `--plan=${plan}`,
        '--unit=evil-name-2',
        '--bump-ids=["evil-name-2"]',
        `--report=${report}`,
        `--research-dir=${researchDir}`,
        '--scope=consumer-facing',
        '--severity=high',
        '--ref=main',
        '--run-url=https://github.com/payloadcms/payload/actions/runs/1',
        `--cwd=${dir}`,
        `--out=${outFile('body.md')}`,
      ],
    })

    expect(code).toBe(1)
    expect(stdout).toBe('::error::output title contains a line break\n')
  })

  describe('outcomes', () => {
    const runOutcomes = async ({ plan, unitSteps }) => {
      const steps = await writeJson({ name: 'unit-steps.json', value: unitSteps })
      const out = outFile('outcomes.json')
      const result = await run({
        args: [
          'outcomes',
          `--plan=${plan}`,
          `--research-dir=${researchDir}`,
          `--verify-dir=${verifyDir}`,
          `--unit-steps=${steps}`,
          `--out=${out}`,
        ],
      })
      const outcomes = result.code === 0 ? JSON.parse(await readFile(out, 'utf8')) : null

      return { ...result, outcomes, outputs: await readOutputs() }
    }

    const statusById = ({ outcomes }) =>
      Object.fromEntries(outcomes.bumps.map((bump) => [bump.bumpId, [bump.status, bump.reason]]))

    it('reports each bump, the unit reasons for open PRs, and red', async () => {
      await initRepo()
      const { plan } = await makePlan({
        storeEntries: [storeEntry({ dependency: 'zod', to: '3.25.0' })],
      })
      await writeResearch({
        bumpId: 'csv-parse-7',
        value: research({ decision: 'decline', reason: 'Uses columns <!-- hide --> @alice.' }),
      })
      await writeResearch({ bumpId: 'csv-parse-5-fallback', value: research() })
      await writeResearch({ bumpId: 'left-pad-1', value: research() })
      await writeFile(
        path.join(verifyDir, 'non-major.json'),
        JSON.stringify({
          failed: [{ bumpId: 'left-pad-1', step: 'build' }],
          passed: ['csv-parse-5-fallback'],
        }),
      )

      const { code, outcomes, outputs } = await runOutcomes({
        plan,
        unitSteps: {
          'csv-parse-7': { prNumber: 7, step: 'update' },
          'non-major': { prNumber: 12, step: 'update' },
        },
      })

      expect(code).toBe(0)
      expect(statusById({ outcomes })).toEqual({
        'csv-parse-5-fallback': ['applied', ''],
        'csv-parse-7': ['declined', `Uses columns  @${ZERO_WIDTH_SPACE}alice.`],
        'left-pad-1': ['failed', 'failed at build'],
        'zod-3': ['stored', 'declined on an earlier run: needs node 26'],
      })
      expect(outcomes.units).toEqual({
        'csv-parse-7': `csv-parse 7.0.2 was declined: Uses columns  @${ZERO_WIDTH_SPACE}alice`,
        'non-major':
          'left-pad 1.0.1 failed at build; zod 3.25.0 was declined or failed on an earlier run: needs node 26',
      })
      expect(outputs).toEqual({ is_red: 'true' })
      const summary = await readFile(summaryFile, 'utf8')
      expect(summary).toContain('- csv-parse 5.6.0 → 5.6.1: applied')
      expect(summary).toContain('- left-pad 1.0.0 → 1.0.1: failed: failed at build')
      expect(summary).not.toContain('<!--')
      expect(summary).toContain(GHSA_NONE)
      expect(summary).toContain('https://github.com/payloadcms/payload/pull/12')
    })

    it('maps skipped and rejected units, and keeps a stored bump red without a comment', async () => {
      await initRepo()
      const { plan } = await makePlan({
        storeEntries: [storeEntry({ dependency: 'zod', to: '3.25.0' })],
      })

      const { outcomes, outputs } = await runOutcomes({
        plan,
        unitSteps: {
          'csv-parse-7': { prNumber: null, step: 'skip-rejected' },
          'non-major': { prNumber: 12, step: 'skip' },
        },
      })

      expect(Object.values(statusById({ outcomes })).map(([status]) => status)).toEqual([
        'skipped',
        'rejected',
        'skipped',
        'stored',
      ])
      expect(outcomes.units).toEqual({})
      expect(outputs).toEqual({ is_red: 'true' })
    })

    it('rejects a skip-rejected unit without turning red', async () => {
      await initRepo()
      const { plan } = await makePlan()

      const { outcomes, outputs } = await runOutcomes({
        plan,
        unitSteps: {
          'csv-parse-7': { prNumber: null, step: 'skip-rejected' },
          'non-major': { prNumber: 12, step: 'skip' },
        },
      })

      expect(statusById({ outcomes })['csv-parse-7'][0]).toBe('rejected')
      expect(outputs).toEqual({ is_red: 'false' })
    })

    it('skips a declined fallback when its major applies, and stays green', async () => {
      await initRepo()
      const { plan } = await makePlan()
      await writeResearch({ bumpId: 'csv-parse-7', value: research() })
      await writeResearch({
        bumpId: 'csv-parse-5-fallback',
        value: research({ decision: 'decline', reason: 'x' }),
      })
      await writeResearch({ bumpId: 'left-pad-1', value: research() })
      await writeResearch({ bumpId: 'zod-3', value: research() })
      await writeFile(
        path.join(verifyDir, 'non-major.json'),
        JSON.stringify({ failed: [], passed: ['left-pad-1', 'zod-3'] }),
      )
      await writeFile(
        path.join(verifyDir, 'csv-parse-7.json'),
        JSON.stringify({ failed: [], passed: ['csv-parse-7'] }),
      )

      const { outcomes, outputs } = await runOutcomes({
        plan,
        unitSteps: {
          'csv-parse-7': { prNumber: 7, step: 'update' },
          'non-major': { prNumber: 12, step: 'update' },
        },
      })

      expect(statusById({ outcomes })).toEqual({
        'csv-parse-5-fallback': ['skipped', 'not needed: csv-parse 7.0.2 is in its own unit'],
        'csv-parse-7': ['applied', ''],
        'left-pad-1': ['applied', ''],
        'zod-3': ['applied', ''],
      })
      expect(outcomes.units).toEqual({})
      expect(outputs).toEqual({ is_red: 'false' })
    })

    it('fails a fallback that joins the group but fails verify', async () => {
      await initRepo()
      const { plan } = await makePlan()
      await writeResearch({
        bumpId: 'csv-parse-7',
        value: research({ decision: 'decline', reason: 'x' }),
      })
      await writeResearch({ bumpId: 'csv-parse-5-fallback', value: research() })
      await writeFile(
        path.join(verifyDir, 'non-major.json'),
        JSON.stringify({
          failed: [{ bumpId: 'csv-parse-5-fallback', step: 'install' }],
          passed: [],
        }),
      )

      const { outcomes } = await runOutcomes({
        plan,
        unitSteps: { 'non-major': { prNumber: 12, step: 'update' } },
      })

      expect(statusById({ outcomes })['csv-parse-5-fallback']).toEqual([
        'failed',
        'failed at install',
      ])
    })

    it('fails an applied bump with no verify result', async () => {
      await initRepo()
      const { plan } = await makePlan()
      await writeResearch({ bumpId: 'left-pad-1', value: research() })

      const { outcomes } = await runOutcomes({
        plan,
        unitSteps: { 'non-major': { prNumber: 12, step: 'update' } },
      })

      expect(statusById({ outcomes })['left-pad-1']).toEqual(['failed', 'no verify result'])
      expect(outcomes.units['non-major']).toContain('left-pad 1.0.1 failed at verify')
    })

    it('turns red for a blocked unit', async () => {
      await initRepo()
      const { plan } = await makePlan()

      const { outcomes, outputs } = await runOutcomes({
        plan,
        unitSteps: {
          'csv-parse-7': { prNumber: 7, step: 'blocked' },
          'non-major': { prNumber: 12, step: 'skip' },
        },
      })

      expect(statusById({ outcomes })['csv-parse-7'][0]).toBe('skipped')
      expect(outputs).toEqual({ is_red: 'true' })
    })

    it('fails a bump with no valid research result', async () => {
      await initRepo()
      const { plan } = await makePlan()

      const { outcomes } = await runOutcomes({
        plan,
        unitSteps: {
          'csv-parse-7': { prNumber: 7, step: 'update' },
          'non-major': { prNumber: null, step: 'create' },
        },
      })

      expect(statusById({ outcomes })['left-pad-1']).toEqual(['failed', 'no valid research result'])
      expect(outcomes.units).toEqual({ 'csv-parse-7': 'csv-parse 7.0.2 failed at research' })
    })
  })

  it('path-guard exits 1 on disallowed change', async () => {
    await initRepo()
    await mkdir(path.join(dir, '.github'))
    await writeFile(path.join(dir, '.github/evil.yml'), 'x')

    const { code, stdout } = await run({ args: ['path-guard', `--cwd=${dir}`] })

    expect(code).toBe(1)
    expect(stdout).toContain('::error::.github/evil.yml: path not allowed')
  })
})
