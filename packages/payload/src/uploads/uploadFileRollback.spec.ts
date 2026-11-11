import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UploadFileRollbacks } from './uploadFileRollback.js'

import {
  publishUploadedFile,
  rollbackUploadFiles,
  stageUploadFileRollback,
} from './uploadFileRollback.js'

describe('upload file rollback', () => {
  let testDirectory: string

  beforeEach(async () => {
    testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-upload-rollback-test-'))
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(testDirectory, { force: true, recursive: true })
  })

  it('should restore the original when a destination write fails before ownership is captured', async () => {
    const filePath = path.join(testDirectory, 'partial-write.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const file = { buffer: Buffer.from('partial replacement'), path: filePath }

    await fs.writeFile(filePath, 'original')
    const stagedFile = await stageUploadFileRollback({ file, rollbacks })

    await fs.writeFile(stagedFile.path, 'partial replacement')

    await rollbackUploadFiles({ rollbacks })

    expect(await fs.readFile(filePath, 'utf8')).toBe('original')
  })

  it('should restore the original after an owned upload was published', async () => {
    const filePath = path.join(testDirectory, 'published-upload.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const file = { buffer: Buffer.from('operation upload'), path: filePath }

    await fs.writeFile(filePath, 'original')

    const stagedFile = await stageUploadFileRollback({ file, rollbacks })

    await fs.writeFile(stagedFile.path, 'operation upload')
    await publishUploadedFile({ file, rollbacks, stagedFile })
    await rollbackUploadFiles({ rollbacks })

    expect(await fs.readFile(filePath, 'utf8')).toBe('original')
  })

  it('should keep a replacement installed immediately before rollback removes its upload', async () => {
    const filePath = path.join(testDirectory, 'new-upload.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const file = { buffer: Buffer.from('operation upload'), path: filePath }
    const stagedFile = await stageUploadFileRollback({ file, rollbacks })

    await fs.writeFile(stagedFile.path, 'operation upload')
    await publishUploadedFile({ file, rollbacks, stagedFile })

    const rename = fs.rename.bind(fs)

    vi.spyOn(fs, 'rename').mockImplementation(async (sourcePath, destinationPath) => {
      if (sourcePath === filePath) {
        await fs.writeFile(filePath, 'concurrent replacement')
      }

      return rename(sourcePath, destinationPath)
    })

    await rollbackUploadFiles({ rollbacks })

    expect(await fs.readFile(filePath, 'utf8')).toBe('concurrent replacement')
  })

  it('should not overwrite a replacement installed immediately before restoring a backup', async () => {
    const filePath = path.join(testDirectory, 'overwritten-upload.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const file = { buffer: Buffer.from('operation upload'), path: filePath }

    await fs.writeFile(filePath, 'original')
    const stagedFile = await stageUploadFileRollback({ file, rollbacks })
    const rollbackDirectory = path.dirname(stagedFile.path)

    await fs.writeFile(stagedFile.path, 'operation upload')
    await publishUploadedFile({ file, rollbacks, stagedFile })

    const link = fs.link.bind(fs)

    vi.spyOn(fs, 'link').mockImplementation(async (sourcePath, destinationPath) => {
      if (destinationPath === filePath) {
        await fs.writeFile(filePath, 'concurrent replacement')
      }

      return link(sourcePath, destinationPath)
    })

    await expect(rollbackUploadFiles({ rollbacks })).rejects.toMatchObject({ code: 'EEXIST' })

    expect(await fs.readFile(filePath, 'utf8')).toBe('concurrent replacement')
    expect(await fs.readFile(path.join(rollbackDirectory, 'backup'), 'utf8')).toBe('original')
  })

  it('should serialize publishes that target the same destination', async () => {
    const filePath = path.join(testDirectory, 'shared-destination.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const firstFile = { buffer: Buffer.from('first upload'), path: filePath }
    const secondFile = { buffer: Buffer.from('second upload'), path: filePath }

    await fs.writeFile(filePath, 'original')

    const firstStagedFile = await stageUploadFileRollback({ file: firstFile, rollbacks })
    const secondStagedFile = await stageUploadFileRollback({ file: secondFile, rollbacks })

    await fs.writeFile(firstStagedFile.path, 'first upload')
    await fs.writeFile(secondStagedFile.path, 'second upload')

    const link = fs.link.bind(fs)
    let releaseFirstPublish!: () => void
    let markFirstPublishStarted!: () => void
    let hasSecondPublishSettled = false
    const firstPublishStarted = new Promise<void>((resolve) => {
      markFirstPublishStarted = resolve
    })
    const firstPublishReleased = new Promise<void>((resolve) => {
      releaseFirstPublish = resolve
    })

    vi.spyOn(fs, 'link').mockImplementation(async (sourcePath, destinationPath) => {
      if (sourcePath === firstStagedFile.path && destinationPath === filePath) {
        markFirstPublishStarted()
        await firstPublishReleased
      }

      return link(sourcePath, destinationPath)
    })

    const firstPublish = publishUploadedFile({
      file: firstFile,
      rollbacks,
      stagedFile: firstStagedFile,
    })

    await firstPublishStarted

    const secondPublish = publishUploadedFile({
      file: secondFile,
      rollbacks,
      stagedFile: secondStagedFile,
    }).finally(() => {
      hasSecondPublishSettled = true
    })

    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(hasSecondPublishSettled).toBe(false)

    releaseFirstPublish()
    await Promise.all([firstPublish, secondPublish])
    await rollbackUploadFiles({ rollbacks })

    expect(await fs.readFile(filePath, 'utf8')).toBe('original')
  })

  it('should reject publication without overwriting a destination changed after staging', async () => {
    const filePath = path.join(testDirectory, 'changed-after-staging.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const file = { buffer: Buffer.from('operation upload'), path: filePath }

    await fs.writeFile(filePath, 'original')

    const stagedFile = await stageUploadFileRollback({ file, rollbacks })
    const rollbackDirectory = path.dirname(stagedFile.path)

    await fs.writeFile(stagedFile.path, 'operation upload')
    await fs.writeFile(filePath, 'concurrent replacement')

    await expect(publishUploadedFile({ file, rollbacks, stagedFile })).rejects.toThrow(
      'destination changed',
    )

    expect(await fs.readFile(filePath, 'utf8')).toBe('concurrent replacement')
    expect(await fs.readFile(path.join(rollbackDirectory, 'backup'), 'utf8')).toBe('original')
    expect(await fs.readFile(stagedFile.path, 'utf8')).toBe('operation upload')
  })

  it('should retain the original and backup when identity capture fails after quarantine', async () => {
    const filePath = path.join(testDirectory, 'identity-capture-failure.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const file = { buffer: Buffer.from('operation upload'), path: filePath }

    await fs.writeFile(filePath, 'original')

    const stagedFile = await stageUploadFileRollback({ file, rollbacks })
    const rollbackDirectory = path.dirname(stagedFile.path)

    await fs.writeFile(stagedFile.path, 'operation upload')

    const lstat = fs.lstat.bind(fs)

    vi.spyOn(fs, 'lstat').mockImplementation(async (targetPath, options) => {
      if (String(targetPath).includes('destination-')) {
        throw new Error('Identity capture failed')
      }

      return lstat(targetPath, options)
    })

    await expect(publishUploadedFile({ file, rollbacks, stagedFile })).rejects.toThrow(
      'Identity capture failed',
    )
    await expect(rollbackUploadFiles({ rollbacks })).rejects.toThrow(
      'could not be identified safely',
    )

    const quarantinedDestinationName = (await fs.readdir(rollbackDirectory)).find((name) =>
      name.startsWith('destination-'),
    )

    expect(await fs.readFile(path.join(rollbackDirectory, 'backup'), 'utf8')).toBe('original')
    expect(quarantinedDestinationName).toBeDefined()
    expect(
      await fs.readFile(path.join(rollbackDirectory, quarantinedDestinationName!), 'utf8'),
    ).toBe('original')
  })

  it('should reject an existing symlink destination without changing it or its target', async () => {
    const targetFilePath = path.join(testDirectory, 'symlink-target.txt')
    const filePath = path.join(testDirectory, 'symlink-upload.txt')
    const rollbacks: UploadFileRollbacks = new Map()

    await fs.writeFile(targetFilePath, 'target bytes')
    await fs.symlink(targetFilePath, filePath)

    await expect(
      stageUploadFileRollback({
        file: { buffer: Buffer.from('operation upload'), path: filePath },
        rollbacks,
      }),
    ).rejects.toThrow('regular file')

    expect(await fs.readlink(filePath)).toBe(targetFilePath)
    expect(await fs.readFile(targetFilePath, 'utf8')).toBe('target bytes')
  })

  it('should retain the backup when an atomic no-overwrite restore is unavailable', async () => {
    const filePath = path.join(testDirectory, 'unsupported-hard-link.txt')
    const rollbacks: UploadFileRollbacks = new Map()
    const file = { buffer: Buffer.from('operation upload'), path: filePath }

    await fs.writeFile(filePath, 'original')

    const stagedFile = await stageUploadFileRollback({ file, rollbacks })
    const rollbackDirectory = path.dirname(stagedFile.path)

    await fs.writeFile(stagedFile.path, 'operation upload')
    await publishUploadedFile({ file, rollbacks, stagedFile })

    vi.spyOn(fs, 'link').mockRejectedValueOnce(
      Object.assign(new Error('Hard links unavailable'), { code: 'EPERM' }),
    )

    await expect(rollbackUploadFiles({ rollbacks })).rejects.toMatchObject({ code: 'EPERM' })

    expect(await fs.readFile(path.join(rollbackDirectory, 'backup'), 'utf8')).toBe('original')
  })
})
