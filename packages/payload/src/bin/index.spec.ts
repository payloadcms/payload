import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const binPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin.js')

describe('CLI exit codes', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await mkdtemp(path.join(tmpdir(), 'payload-cli-exit-'))
  })

  afterEach(async () => {
    await rm(testDir, { force: true, recursive: true })
  })

  it.each([
    { exitCode: 0, source: 'await Promise.resolve()', state: 'completes' },
    { exitCode: 13, source: 'await new Promise(() => {})', state: 'remains pending' },
    { exitCode: 1, source: "throw new Error('EXPECTED_FAILURE')", state: 'throws' },
  ])('should exit with code $exitCode when the script $state', async ({ exitCode, source }) => {
    const scriptPath = path.join(testDir, 'script.mjs')

    await writeFile(scriptPath, `console.log('SCRIPT_STARTED')\n${source}\n`)

    const result = spawnSync(process.execPath, [binPath, 'run', scriptPath], {
      cwd: testDir,
      encoding: 'utf8',
      timeout: 10_000,
    })

    expect(result.error).toBeUndefined()
    expect(result.signal).toBeNull()
    expect(result.stdout).toContain('SCRIPT_STARTED')
    expect(result.status).toBe(exitCode)
  })
})
