import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, expect, it } from 'vitest'

import { copyLocalFile } from './localStorage.js'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => fs.rm(directory, { force: true, recursive: true })),
  )
})

it('should reject a destination directory symlink before writing outside storage', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-file-copy-'))
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-file-outside-'))
  directories.push(directory, outside)
  await fs.writeFile(path.join(directory, 'source.txt'), 'source bytes')
  await fs.symlink(outside, path.join(directory, 'archive'))

  await expect(
    copyLocalFile({ from: 'source.txt', staticDir: directory, to: 'archive/source.txt' }),
  ).rejects.toThrow()
  await expect(fs.stat(path.join(outside, 'source.txt'))).rejects.toMatchObject({ code: 'ENOENT' })
})
