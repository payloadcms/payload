import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { readReport } from './report.mjs'

describe('readReport', () => {
  const dirs = []

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['missing plan.actions', JSON.stringify({ findings: [], plan: {} })],
    ['missing findings', JSON.stringify({ plan: { actions: [] } })],
  ])('should fail closed on %s', async (_name, content) => {
    const dir = await mkdtemp(path.join(tmpdir(), 'audit-deps-'))
    dirs.push(dir)
    const file = path.join(dir, 'audit_output.json')
    await writeFile(file, content)

    await expect(readReport({ path: file })).rejects.toThrow('audit report missing or invalid')
  })
})
