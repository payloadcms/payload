import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { findUp, findUpSync } from './findUp.js'

describe('findUp', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'payload-findup-')))
    fs.mkdirSync(path.join(tmpDir, 'nested'))
    fs.writeFileSync(path.join(tmpDir, 'target.txt'), '')
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(tmpDir, 'nested'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    fs.rmSync(tmpDir, { force: true, recursive: true })
  })

  it.each(['.', './'])('findUpSync should resolve relative dir %s and find a file', (dir) => {
    expect(findUpSync({ dir, fileNames: ['target.txt'] })).toBe(path.join(tmpDir, 'target.txt'))
  })

  it.each(['.', './'])(
    'findUpSync should return null for relative dir %s when nothing is found',
    (dir) => {
      expect(findUpSync({ dir, fileNames: ['does-not-exist.payload-test'] })).toBeNull()
    },
  )

  it.each(['.', './'])('findUp should resolve relative dir %s and find a file', async (dir) => {
    await expect(findUp({ dir, fileNames: ['target.txt'] })).resolves.toBe(
      path.join(tmpDir, 'target.txt'),
    )
  })

  it.each(['.', './'])(
    'findUp should return null for relative dir %s when nothing is found',
    async (dir) => {
      await expect(findUp({ dir, fileNames: ['does-not-exist.payload-test'] })).resolves.toBeNull()
    },
  )
})
