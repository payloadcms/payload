import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { writeStepSummary } from './writeStepSummary.js'

describe('writeStepSummary', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'summary-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { force: true, recursive: true })
  })

  it('should append markdown to the summary file', () => {
    const summaryPath = path.join(tempDir, 'summary.md')

    writeStepSummary({ markdown: '# a', summaryPath })
    writeStepSummary({ markdown: '# b', summaryPath })

    expect(fs.readFileSync(summaryPath, 'utf8')).toBe('# a\n# b\n')
  })

  it('should do nothing when summaryPath is undefined', () => {
    expect(() => writeStepSummary({ markdown: '# a', summaryPath: undefined })).not.toThrow()
  })
})
