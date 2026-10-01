import fs from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fileExists } from './fileExists.js'

describe('fileExists', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false when the path does not exist', async () => {
    vi.spyOn(fs, 'stat').mockRejectedValueOnce(
      Object.assign(new Error('Path does not exist'), { code: 'ENOENT' }),
    )

    await expect(fileExists('/missing/file.txt')).resolves.toBe(false)
  })

  it('should preserve filesystem errors that do not mean the path is missing', async () => {
    const permissionError = Object.assign(new Error('Permission denied'), { code: 'EACCES' })

    vi.spyOn(fs, 'stat').mockRejectedValueOnce(permissionError)

    await expect(fileExists('/protected/file.txt')).rejects.toBe(permissionError)
  })
})
