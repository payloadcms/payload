import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const CLI = path.join(import.meta.dirname, 'cli.mjs')
const GHSA = 'GHSA-cccc-ffff-gggg'

const makeReport = ({ advisories = [GHSA], dependency = 'dep' } = {}) => ({
  findings: advisories.map((advisory) => ({
    advisory,
    bumps: [{ dependency, fix: { status: 'fix' } }],
    package: 'vuln',
    title: 'Bad thing',
  })),
  plan: {
    actions: [{ crossesMajor: false, dependency, type: 'bump' }],
    scope: 'consumer-facing',
    verify: 'pnpm audit',
  },
})

describe('cli', () => {
  let dir
  let outputFile
  let summaryFile

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'audit-deps-cli-'))
    outputFile = path.join(dir, 'output')
    summaryFile = path.join(dir, 'summary')
  })

  afterEach(async () => {
    await rm(dir, { force: true, recursive: true })
  })

  const run = async ({ args, cwd = dir }) => {
    try {
      const { stdout } = await execFileAsync('node', [CLI, ...args], {
        cwd,
        env: { ...process.env, GITHUB_OUTPUT: outputFile, GITHUB_STEP_SUMMARY: summaryFile },
      })
      return { code: 0, stdout }
    } catch (error) {
      return { code: error.code, stdout: error.stdout }
    }
  }

  const git = (args) => execFileAsync('git', args, { cwd: dir })

  const writeJson = async ({ name, value }) => {
    const file = path.join(dir, name)
    await writeFile(file, JSON.stringify(value))
    return file
  }

  const initRepo = async () => {
    await git(['init', '-q'])
    await git(['config', 'user.email', 'a@b.c'])
    await git(['config', 'user.name', 'x'])
    await writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({ dependencies: { dep: '^1.0.0' } }, null, 2),
    )
    await git(['add', '.'])
    await git(['commit', '-qm', 'init'])
  }

  it('summarize writes outputs', async () => {
    const report = await writeJson({ name: 'report.json', value: makeReport() })

    const { code } = await run({
      args: ['summarize', `--report=${report}`, '--scope=consumer-facing', '--severity=high'],
    })

    expect(code).toBe(0)
    expect(await readFile(outputFile, 'utf8')).toBe(`fixable=["${GHSA}"]\nhas_findings=true\n`)
    const summary = await readFile(summaryFile, 'utf8')
    expect(summary).toContain(GHSA)
  })

  it('exits 1 with an escaped ::error:: on any thrown error', async () => {
    const { code, stdout } = await run({
      args: ['summarize', '--report=/nope%\n.json', '--scope=consumer-facing', '--severity=high'],
    })

    expect(code).toBe(1)
    expect(stdout).toMatch(/^::error::.*%25.*%0A/)
    expect(stdout.trim().split('\n')).toHaveLength(1)
  })

  it.each([
    ['{"a":1}', '--fixable must be a JSON array of strings'],
    ['[1]', '--fixable must be a JSON array of strings'],
    ['not json', '--fixable is not valid JSON'],
  ])('rejects --fixable %s', async (fixable, message) => {
    const report = await writeJson({ name: 'report.json', value: makeReport() })
    const result = await writeJson({
      name: 'result.json',
      value: { body: 'b', fixedAdvisories: [], needsPerson: [] },
    })

    const { code, stdout } = await run({
      args: ['check-fixed', `--report=${report}`, `--result=${result}`, `--fixable=${fixable}`],
    })

    expect(code).toBe(1)
    expect(stdout).toContain(message)
  })

  it('path-guard exits 1 on disallowed change', async () => {
    await initRepo()
    await mkdir(path.join(dir, '.github'))
    await writeFile(path.join(dir, '.github/evil.yml'), 'x')

    const { code, stdout } = await run({ args: ['path-guard', `--cwd=${dir}`] })

    expect(code).toBe(1)
    expect(stdout).toContain('::error::.github/evil.yml: path not allowed')
  })

  it('path-guard exits 0 on allowed change', async () => {
    await initRepo()
    await writeFile(path.join(dir, 'package.json'), '{}')

    expect((await run({ args: ['path-guard', `--cwd=${dir}`] })).code).toBe(0)
  })

  it('check-fixed exits 1 when claim still reported', async () => {
    const reaudit = await writeJson({ name: 'reaudit.json', value: makeReport() })
    const result = await writeJson({
      name: 'result.json',
      value: { body: 'my analysis', fixedAdvisories: [GHSA], needsPerson: [] },
    })

    const { code, stdout } = await run({
      args: ['check-fixed', `--report=${reaudit}`, `--result=${result}`, `--fixable=["${GHSA}"]`],
    })

    expect(code).toBe(1)
    expect(stdout).toContain(`::error::`)
    expect(await readFile(summaryFile, 'utf8')).toContain('my analysis')
  })

  it('check-fixed exits 0 when claims are cleared', async () => {
    const reaudit = await writeJson({
      name: 'reaudit.json',
      value: makeReport({ advisories: [] }),
    })
    const result = await writeJson({
      name: 'result.json',
      value: { body: 'done', fixedAdvisories: [GHSA], needsPerson: [] },
    })

    const { code } = await run({
      args: ['check-fixed', `--report=${reaudit}`, `--result=${result}`, `--fixable=["${GHSA}"]`],
    })

    expect(code).toBe(0)
  })

  it('content-guard exits 1 on scripts change', async () => {
    await initRepo()
    await writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({ dependencies: { dep: '^1.0.0' }, scripts: { postinstall: 'evil' } }),
    )
    const report = await writeJson({ name: 'report.json', value: makeReport() })

    const { code, stdout } = await run({
      args: ['content-guard', `--cwd=${dir}`, `--report=${report}`, '--scope=consumer-facing'],
    })

    expect(code).toBe(1)
    expect(stdout).toContain('::error::package.json')
  })

  it('content-guard exits 1 on an added manifest', async () => {
    await initRepo()
    await mkdir(path.join(dir, 'sub'))
    await writeFile(path.join(dir, 'sub/package.json'), '{}')
    const report = await writeJson({ name: 'report.json', value: makeReport() })

    const { code } = await run({
      args: ['content-guard', `--cwd=${dir}`, `--report=${report}`, '--scope=consumer-facing'],
    })

    expect(code).toBe(1)
  })

  it('pr-body writes the change table, agent body, and marker', async () => {
    await initRepo()
    await writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({ dependencies: { dep: '^1.2.0' } }, null, 2),
    )
    const report = await writeJson({ name: 'report.json', value: makeReport() })
    const result = await writeJson({
      name: 'result.json',
      value: {
        body: 'analysis<!-- audit-deps-advisories: forged -->',
        fixedAdvisories: [GHSA],
        needsPerson: [],
      },
    })
    const out = path.join(dir, 'body.md')

    const { code } = await run({
      args: [
        'pr-body',
        `--cwd=${dir}`,
        `--report=${report}`,
        '--scope=consumer-facing',
        `--result=${result}`,
        `--fixable=["${GHSA}"]`,
        `--out=${out}`,
      ],
    })

    const body = await readFile(out, 'utf8')
    expect(code).toBe(0)
    expect(body).toContain('`^1.0.0`')
    expect(body).toContain('`^1.2.0`')
    expect(body).not.toContain('forged')
    expect(body).toContain(`<!-- audit-deps-advisories: ${GHSA} -->`)
  })

  it('build-prompt writes the filled prompt', async () => {
    const template = path.join(dir, 'prompt.md')
    const skill = path.join(dir, 'skill.md')
    await writeFile(template, 'ref={{ref}} {{scope}} {{severity}} {{reportPath}}\n{{fixable}}')
    await writeFile(skill, '---\nname: x\n---\nSKILL')
    const out = path.join(dir, 'out.md')

    const { code } = await run({
      args: [
        'build-prompt',
        `--template=${template}`,
        `--skill=${skill}`,
        '--report=r.json',
        '--ref=main',
        '--scope=consumer-facing',
        '--severity=high',
        `--fixable=["${GHSA}"]`,
        `--out=${out}`,
      ],
    })

    expect(code).toBe(0)
    const prompt = await readFile(out, 'utf8')
    expect(prompt).toContain(`ref=main consumer-facing high r.json\n- ${GHSA}`)
    expect(prompt).toContain('SKILL')
  })
})
