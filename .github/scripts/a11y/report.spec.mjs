import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { buildSummary } from './report.mjs'
import A11yReporter from './reporter.mjs'

const directories = []
const temporaryDirectory = () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'a11y-report-'))
  directories.push(directory)
  return directory
}
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { force: true, recursive: true })
})
const attempt = ({
  status = 'passed',
  retry = 0,
  scans = [],
  skippedSteps = [],
  errors = [],
} = {}) => ({ status, retry, scans, skippedSteps, errors, attachments: [] })
const entry = ({
  workflow = 'Document editing',
  attempts = [attempt()],
  expectedStatus = 'passed',
} = {}) => ({
  workflow,
  title: 'should save',
  file: 'a11y/e2e.spec.ts',
  line: 12,
  expectedStatus,
  attempts,
})
const report = ({ tests = [entry()], errors = [], status = 'passed' } = {}) => ({
  framework: 'next',
  tests,
  errors,
  status,
})

describe('per-job workflow summary', () => {
  it('should render a single framework with one count per selected test', () => {
    const output = buildSummary({ report: report({ tests: [entry(), entry()] }) })
    expect(output).toContain('Accessibility workflow results — next')
    expect(output).toContain('**2 tests**')
    expect(output).toContain('| Document editing | ✅ 2/2 passed |')
    expect(output).not.toContain('tanstack-start')
  })

  it('should expose retries without inflating tests or final-attempt scans', () => {
    const output = buildSummary({
      report: report({
        tests: [
          entry({
            attempts: [
              attempt({
                status: 'failed',
                scans: [{ name: 'form', violations: 2 }],
                errors: ['Focus lost'],
              }),
              attempt({ retry: 1, scans: [{ name: 'form', violations: 0 }] }),
            ],
          }),
        ],
      }),
    })
    expect(output).toContain('**1 test**')
    expect(output).toContain('1 passed after retry')
    expect(output).toContain('1 state scans completed · 0 violations')
    expect(output).toContain('Passed on attempt 2')
    expect(output).toContain('Focus lost')
  })

  it('should never mark skipped steps, expected failures or unexecuted tests as passed', () => {
    for (const test of [
      entry({ attempts: [attempt({ skippedSteps: ['focus restoration'] })] }),
      entry({ attempts: [] }),
      entry({ expectedStatus: 'failed', attempts: [attempt({ status: 'failed' })] }),
      entry({ attempts: [attempt({ status: 'interrupted' })] }),
    ]) {
      const output = buildSummary({ report: report({ tests: [test] }) })
      expect(output).toContain('Incomplete')
      expect(output).not.toContain('✅ 1/1 passed')
    }
  })

  it('should separate scanner validation and include runner failures', () => {
    const output = buildSummary({
      report: report({
        tests: [entry({ workflow: 'Scanner validation' })],
        errors: ['Server exited'],
        status: 'failed',
      }),
    })
    expect(output).toContain('**Scanner validation**')
    expect(output).toContain('Server exited')
    expect(output).toContain('Run: failed')
  })

  it('should escape filenames, names and failure messages while linking the test source', () => {
    const output = buildSummary({
      report: report({
        tests: [
          entry({
            workflow: 'Edit | <img>',
            attempts: [
              attempt({ status: 'failed', errors: ['\u001b[31m<script>bad</script>\u001b[0m'] }),
            ],
          }),
        ],
      }),
      matchedFiles: ['a|<img>.tsx'],
      repositoryURL: 'https://github.com/payloadcms/payload',
      sha: 'abc',
    })
    expect(output).not.toContain('<img>')
    expect(output).not.toContain('<script>')
    expect(output).not.toContain('\u001b')
    expect(output).toContain('&#124;')
    expect(output).toContain('/blob/abc/test/a11y/e2e.spec.ts#L12')
  })
})

describe('summary publication', () => {
  it('should publish this job’s Markdown with its existing artifact URL', async () => {
    const { publishSummary } = await import('./report.mjs')
    expect(typeof publishSummary).toBe('function')
    const directory = temporaryDirectory()
    const reportPath = path.join(directory, 'summary.md')
    const jobSummary = path.join(directory, 'job.md')
    writeFileSync(reportPath, '## Accessibility workflow results — next\n')
    publishSummary({
      reportPath,
      env: {
        GITHUB_STEP_SUMMARY: jobSummary,
        A11Y_EVIDENCE_URL: 'https://github.com/run/artifacts/1',
        A11Y_TEST_OUTCOME: 'success',
      },
    })
    expect(readFileSync(jobSummary, 'utf8')).toContain(
      '[Results and failure evidence](https://github.com/run/artifacts/1)',
    )
    expect(readFileSync(reportPath, 'utf8')).toBe(readFileSync(jobSummary, 'utf8'))
  })

  it('should report missing output after setup failure without reading another job or attempt', async () => {
    const { publishSummary } = await import('./report.mjs')
    expect(typeof publishSummary).toBe('function')
    const directory = temporaryDirectory()
    const reportPath = path.join(directory, 'summary.md')
    publishSummary({ reportPath, env: { PAYLOAD_FRAMEWORK: 'next', A11Y_TEST_OUTCOME: 'skipped' } })
    expect(readFileSync(reportPath, 'utf8')).toContain('No test report was produced')
    expect(readFileSync(reportPath, 'utf8')).not.toContain('✅')
  })

  it('should flag a failed test command even when Playwright produced passing results', async () => {
    const { publishSummary } = await import('./report.mjs')
    expect(typeof publishSummary).toBe('function')
    const reportPath = path.join(temporaryDirectory(), 'summary.md')
    writeFileSync(reportPath, '✅ completed checks\n')
    publishSummary({ reportPath, env: { A11Y_TEST_OUTCOME: 'failure' } })
    expect(readFileSync(reportPath, 'utf8')).toContain('Test command failed')
  })
})

describe('real Playwright reporter', () => {
  it('should write Markdown directly and capture retries, scans, failures and skipped steps', async () => {
    const { createRequire } = await import('node:module')
    const { spawnSync } = await import('node:child_process')
    const { fileURLToPath } = await import('node:url')
    const require = createRequire(import.meta.url)
    const directory = temporaryDirectory()
    const reportPath = path.join(directory, 'summary.md')
    writeFileSync(
      path.join(directory, 'playwright.config.mjs'),
      `export default ${JSON.stringify({ testDir: directory, testMatch: '*.spec.ts', workers: 1, retries: 1, outputDir: path.join(directory, 'results'), reporter: [[fileURLToPath(new URL('./reporter.mjs', import.meta.url)), { framework: 'next', outputFile: reportPath }]] })}`,
    )
    writeFileSync(
      path.join(directory, 'e2e.spec.ts'),
      `
      import { test, expect } from ${JSON.stringify(require.resolve('@playwright/test'))}
      test.describe('Admin accessibility', () => {
        test.describe('Document editing', () => {
          test('clean', async ({}, info) => { info.annotations.push({ type: 'a11y-scan', description: JSON.stringify({ name: 'form', violations: 0 }) }) })
          test('retry', async ({}, info) => { expect(info.retry).toBeGreaterThan(0) })
          test('skipped step', async () => { await test.step.skip('focus restoration', async () => {}) })
          test.skip('not run', async () => {})
          test('failure', async () => { expect('body').toBe('Delete button') })
        })
      })
    `,
    )
    const result = spawnSync(
      process.execPath,
      [
        require.resolve('@playwright/test/cli'),
        'test',
        '--config',
        path.join(directory, 'playwright.config.mjs'),
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          CI: '',
          FORCE_COLOR: '0',
          A11Y_MATCHED_FILES: '{"files":["packages/ui/Form.tsx"],"omitted":17}',
        },
        timeout: 30000,
      },
    )
    expect(result.status, result.stdout + result.stderr).toBe(1)
    expect(result.stdout).toContain(`Accessibility report saved to:\n${reportPath}`)
    const markdown = readFileSync(reportPath, 'utf8')
    expect(markdown).toContain(
      '1 passed first attempt · 1 passed after retry · 1 failed · 2 incomplete',
    )
    expect(markdown).toContain('1 state scans completed · 0 violations')
    expect(markdown).toContain('Skipped check: focus restoration')
    expect(markdown).toContain('Delete button')
    expect(markdown).toContain('packages/ui/Form.tsx')
    expect(markdown).toContain('17 more matching files omitted')
  }, 40000)
})

describe('invalid scan evidence', () => {
  it('should mark a passing test incomplete if its scan evidence cannot be decoded', async () => {
    const reportPath = path.join(temporaryDirectory(), 'summary.md')
    const root = { title: '', parent: undefined }
    const admin = { title: 'Admin accessibility', parent: root }
    const group = { title: 'Document editing', parent: admin }
    const test = {
      id: 'save',
      title: 'save',
      parent: group,
      location: { file: '/repo/test/a11y/e2e.spec.ts', line: 1 },
      expectedStatus: 'passed',
    }
    const reporter = new A11yReporter({ framework: 'next', outputFile: reportPath })
    reporter.onBegin({ rootDir: '/repo/test' }, { allTests: () => [test] })
    reporter.onTestEnd(test, {
      status: 'passed',
      retry: 0,
      annotations: [{ type: 'a11y-scan', description: 'invalid JSON' }],
      errors: [],
      attachments: [],
    })
    await reporter.onEnd({ status: 'passed' })
    const markdown = readFileSync(reportPath, 'utf8')
    expect(markdown).toContain('Incomplete')
    expect(markdown).toContain('Missing evidence: Invalid axe scan evidence')
    expect(markdown).not.toContain('✅ 1/1 passed')
  })
})

describe('matching-file transport', () => {
  it('should preserve a small list and disclose omitted files for oversized Unicode paths', async () => {
    const { boundMatchedFiles } = await import('./matched-files.mjs')
    expect(boundMatchedFiles({ files: ['packages/ui/Form.tsx'] })).toEqual({
      files: ['packages/ui/Form.tsx'],
      omitted: 0,
    })
    const files = Array.from(
      { length: 3000 },
      (_, index) => `packages/ui/${index}-${'界'.repeat(70)}.tsx`,
    )
    const bounded = boundMatchedFiles({ files })
    expect(Buffer.byteLength(JSON.stringify(bounded))).toBeLessThan(64 * 1024)
    expect(bounded.files.length).toBeGreaterThan(0)
    expect(bounded.omitted).toBeGreaterThan(0)
    expect(bounded.files).toEqual(files.slice(0, bounded.files.length))
    expect(bounded.files.length + bounded.omitted).toBe(3000)
    const markdown = buildSummary({
      report: report(),
      matchedFiles: bounded.files,
      omittedFiles: bounded.omitted,
    })
    expect(markdown).toContain(`${bounded.omitted} more matching files omitted`)
  })

  it('should read the full list through stdin and write only bounded job output', async () => {
    const { spawnSync } = await import('node:child_process')
    const { fileURLToPath } = await import('node:url')
    const directory = temporaryDirectory()
    const outputFile = path.join(directory, 'outputs')
    const inputFile = path.join(directory, 'files.json')
    const files = Array.from(
      { length: 3000 },
      (_, index) => `packages/ui/${index}-${'x'.repeat(70)}.tsx`,
    )
    writeFileSync(inputFile, JSON.stringify(files))
    const input = openSync(inputFile, 'r')
    let result
    try {
      result = spawnSync(
        process.execPath,
        [fileURLToPath(new URL('./matched-files.mjs', import.meta.url))],
        {
          stdio: [input, 'pipe', 'pipe'],
          encoding: 'utf8',
          timeout: 10000,
          env: { ...process.env, GITHUB_OUTPUT: outputFile },
        },
      )
    } finally {
      closeSync(input)
    }
    expect(result.status, result.stderr).toBe(0)
    const output = readFileSync(outputFile, 'utf8')
    expect(output.startsWith('files=')).toBe(true)
    expect(Buffer.byteLength(output)).toBeLessThan(64 * 1024)
    const bounded = JSON.parse(output.slice('files='.length))
    expect(bounded.files.length + bounded.omitted).toBe(3000)
    expect(bounded.omitted).toBeGreaterThan(0)
  })
})
