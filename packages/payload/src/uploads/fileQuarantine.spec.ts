import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { quarantineFile } from './fileQuarantine.js'

let directory: string

beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-quarantine-test-'))
})
afterEach(async () => {
  vi.restoreAllMocks()
  await fs.rm(directory, { force: true, recursive: true })
})

test('should restore the file and remove quarantine after identity capture fails', async () => {
  const filePath = path.join(directory, 'upload.txt')
  const failure = new Error('Identity unavailable')

  await fs.writeFile(filePath, 'original')
  vi.spyOn(fs, 'lstat').mockRejectedValueOnce(failure)
  await expect(quarantineFile({ filePath })).rejects.toBe(failure)
  expect(await fs.readFile(filePath, 'utf8')).toBe('original')
  expect(await fs.readdir(directory)).toEqual(['upload.txt'])
})

test('should retain quarantine rather than overwrite a concurrent replacement', async () => {
  const filePath = path.join(directory, 'upload.txt')

  await fs.writeFile(filePath, 'original')
  vi.spyOn(fs, 'lstat').mockImplementationOnce(async () => {
    await fs.writeFile(filePath, 'replacement')
    throw new Error('Identity unavailable')
  })
  await expect(quarantineFile({ filePath })).rejects.toBeInstanceOf(AggregateError)
  const quarantine = (await fs.readdir(directory)).find((name) =>
    name.startsWith('.payload-file-quarantine-'),
  )!

  expect(await fs.readFile(filePath, 'utf8')).toBe('replacement')
  expect(await fs.readFile(path.join(directory, quarantine, 'file'), 'utf8')).toBe('original')
})
