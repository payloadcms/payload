import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { findConfig } from './find.js'

describe('findConfig', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'payload-find-config-')))
    fs.mkdirSync(path.join(tmpDir, 'src'))
    fs.writeFileSync(path.join(tmpDir, 'src', 'payload.config.ts'), '')
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    vi.stubEnv('PAYLOAD_CONFIG_PATH', '')
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    fs.rmSync(tmpDir, { force: true, recursive: true })
  })

  it('should find the config when tsconfig rootDir is relative', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { rootDir: './' } }),
    )

    expect(findConfig()).toBe(path.join(tmpDir, 'src', 'payload.config.ts'))
  })

  it('should resolve a relative rootDir against the tsconfig directory', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { rootDir: './src' } }),
    )

    expect(findConfig()).toBe(path.join(tmpDir, 'src', 'payload.config.ts'))
  })
})
