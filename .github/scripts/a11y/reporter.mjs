import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { buildSummary } from './report.mjs'

/** Collects reporting evidence without changing Playwright's test outcomes. */
export default class A11yReporter {
  constructor({
    framework = process.env.PAYLOAD_FRAMEWORK || 'next',
    outputFile = process.env.A11Y_REPORT_PATH,
    outputDirectory = process.env.A11Y_REPORT_DIR,
  } = {}) {
    this.framework = framework
    this.outputFile =
      outputFile ||
      (outputDirectory
        ? path.join(
            outputDirectory,
            `${new Date().toISOString().replace(/[:.]/g, '-')}-${framework}.md`,
          )
        : undefined)
    this.tests = new Map()
    this.skippedSteps = new WeakMap()
    this.errors = []
  }

  printsToStdio() {
    return false
  }

  onBegin(config, suite) {
    for (const test of suite.allTests()) {
      const titles = []
      let parent = test.parent
      while (parent) {
        titles.unshift(parent.title)
        parent = parent.parent
      }
      const file = path.relative(config.rootDir, test.location.file).split(path.sep).join('/')
      const adminIndex = titles.indexOf('Admin accessibility')
      const workflow = file.endsWith('focus-indicators.e2e.spec.ts')
        ? 'Scanner validation'
        : adminIndex >= 0
          ? (titles[adminIndex + 1] ?? 'Other accessibility checks')
          : 'Other accessibility checks'
      this.tests.set(test.id, {
        file,
        line: test.location.line,
        title: test.title,
        workflow,
        expectedStatus: test.expectedStatus,
        attempts: [],
      })
    }
  }

  onStepEnd(_test, result, step) {
    if (step.annotations?.some(({ type }) => type === 'skip')) {
      const skipped = this.skippedSteps.get(result) ?? []
      skipped.push(step.title)
      this.skippedSteps.set(result, skipped)
    }
  }

  onTestEnd(test, result) {
    const entry = this.tests.get(test.id)
    const scans = []
    const evidenceErrors = []
    for (const annotation of result.annotations ?? []) {
      if (annotation.type !== 'a11y-scan') continue
      try {
        const scan = JSON.parse(annotation.description)
        if (
          typeof scan.name !== 'string' ||
          !Number.isInteger(scan.violations) ||
          scan.violations < 0
        )
          throw new Error('Invalid scan annotation')
        scans.push(scan)
      } catch {
        evidenceErrors.push(`Invalid axe scan evidence for ${test.title}`)
      }
    }
    entry.expectedStatus = test.expectedStatus
    entry.attempts.push({
      status: result.status,
      retry: result.retry,
      scans,
      evidenceErrors,
      skippedSteps: this.skippedSteps.get(result) ?? [],
      errors: (result.errors ?? []).map(
        ({ message, value }) => message ?? value ?? 'Unknown error',
      ),
      attachments: (result.attachments ?? []).map(({ name, path: filePath }) => ({
        name,
        file: filePath ? path.basename(filePath) : undefined,
      })),
    })
  }

  onError(error) {
    this.errors.push(error.message ?? error.value ?? 'Unknown runner error')
  }

  async onEnd(result) {
    let matchedFiles = []
    let omittedFiles = 0
    try {
      const matching = JSON.parse(process.env.A11Y_MATCHED_FILES || '{"files":[],"omitted":0}')
      if (
        !Array.isArray(matching.files) ||
        matching.files.some((file) => typeof file !== 'string') ||
        !Number.isInteger(matching.omitted) ||
        matching.omitted < 0
      )
        throw new Error('Invalid matching-file list')
      matchedFiles = matching.files
      omittedFiles = matching.omitted
    } catch {
      matchedFiles = []
      this.errors.push('Matching-file information unavailable.')
    }
    const markdown = buildSummary({
      report: {
        framework: this.framework,
        status: result.status,
        tests: [...this.tests.values()],
        errors: this.errors,
      },
      matchedFiles,
      omittedFiles,
      sha: process.env.GITHUB_SHA,
      repositoryURL: process.env.GITHUB_REPOSITORY
        ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}`
        : '',
    })
    if (!this.outputFile) throw new Error('A11Y_REPORT_PATH or A11Y_REPORT_DIR is required')
    mkdirSync(path.dirname(this.outputFile), { recursive: true })
    writeFileSync(this.outputFile, markdown)
    if (process.env.CI !== 'true')
      console.log(`\nAccessibility report saved to:\n${path.resolve(this.outputFile)}\n`)
  }
}
