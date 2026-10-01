import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { FileIdentity } from './fileIdentity.js'
import type { FileToSave } from './types.js'

import {
  getFileHandleIdentity,
  getFileIdentity,
  hasFileIdentity,
  hasRenameStableFileIdentity,
} from './fileIdentity.js'
import { linkFileWithoutOverwrite } from './linkFileWithoutOverwrite.js'

type UploadFileRollback = {
  backupFileIdentity?: FileIdentity
  backupFilePath?: string
  directoryPath: string
  expectedDestinationFileIdentity?: FileIdentity
  filePath: string
  publicationState: 'failed' | 'indeterminate' | 'not-published' | 'owned'
  publishQueue: Promise<void>
  stagedFilePaths: Set<string>
  uploadedFileIdentity?: FileIdentity
}

export type UploadFileRollbacks = Map<string, UploadFileRollback>

export const stageUploadFileRollback = async ({
  file,
  rollbacks,
}: {
  file: FileToSave
  rollbacks: UploadFileRollbacks
}): Promise<FileToSave> => {
  let rollback = rollbacks.get(file.path)

  if (!rollback) {
    rollback = await createUploadFileRollback({ filePath: file.path })
    rollbacks.set(file.path, rollback)
  }

  const stagedFilePath = path.join(rollback.directoryPath, `upload-${randomUUID()}`)

  rollback.stagedFilePaths.add(stagedFilePath)

  return { ...file, path: stagedFilePath }
}

export const publishUploadedFile = async ({
  file,
  rollbacks,
  stagedFile,
}: {
  file: FileToSave
  rollbacks: UploadFileRollbacks
  stagedFile: FileToSave
}): Promise<void> => {
  const rollback = rollbacks.get(file.path)

  if (!rollback || !rollback.stagedFilePaths.has(stagedFile.path)) {
    throw new Error('The staged upload does not belong to this operation.')
  }

  const precedingPublish = rollback.publishQueue
  let releasePublish!: () => void

  rollback.publishQueue = new Promise<void>((resolve) => {
    releasePublish = resolve
  })

  await precedingPublish

  try {
    const fileHandle = await fs.open(stagedFile.path, 'r')

    try {
      rollback.publicationState = 'indeterminate'
      const quarantinedDestination = await quarantineUploadDestination({ rollback })
      const hasExpectedDestination = rollback.expectedDestinationFileIdentity !== undefined
      const hasMatchingDestination = hasExpectedDestination
        ? hasRenameStableFileIdentity({
            actual: quarantinedDestination?.fileIdentity,
            expected: rollback.expectedDestinationFileIdentity!,
          })
        : quarantinedDestination === undefined

      if (!hasMatchingDestination) {
        rollback.publicationState = 'failed'

        if (quarantinedDestination) {
          await restoreQuarantinedUploadDestination({ quarantinedDestination, rollback })
        }

        throw new Error('The upload destination changed before the staged file was published.')
      }

      try {
        await linkFileWithoutOverwrite({
          sourceFilePath: stagedFile.path,
          targetFilePath: rollback.filePath,
        })
      } catch (error) {
        rollback.publicationState = 'failed'

        if (quarantinedDestination) {
          try {
            await restoreQuarantinedUploadDestination({ quarantinedDestination, rollback })
          } catch (restoreError) {
            throw new AggregateError(
              [error, restoreError],
              'The staged upload could not be installed or its prior destination restored.',
            )
          }
        }

        throw error
      }

      rollback.publicationState = 'indeterminate'
      rollback.uploadedFileIdentity = await getFileHandleIdentity({ fileHandle })
      rollback.expectedDestinationFileIdentity = rollback.uploadedFileIdentity
      rollback.publicationState = 'owned'
    } finally {
      await fileHandle.close()
    }
  } finally {
    releasePublish()
  }
}

export const cleanupUploadFileRollbacks = async ({
  rollbacks,
}: {
  rollbacks: UploadFileRollbacks
}): Promise<void> => {
  const errors: unknown[] = []

  for (const rollback of rollbacks.values()) {
    try {
      await fs.rm(rollback.directoryPath, { force: true, recursive: true })
    } catch (error) {
      errors.push(error)
    }
  }

  rollbacks.clear()
  throwCollectedErrors({ errors })
}

export const rollbackUploadFiles = async ({
  rollbacks,
}: {
  rollbacks: UploadFileRollbacks
}): Promise<void> => {
  const errors: unknown[] = []

  for (const rollback of [...rollbacks.values()].reverse()) {
    try {
      await rollbackUploadFile({ rollback })
      await fs.rm(rollback.directoryPath, { force: true, recursive: true })
      rollbacks.delete(rollback.filePath)
    } catch (error) {
      errors.push(error)
    }
  }

  throwCollectedErrors({ errors })
}

const createUploadFileRollback = async ({
  filePath,
}: {
  filePath: string
}): Promise<UploadFileRollback> => {
  const originalFileIdentity = await getFileIdentity({ filePath })

  if (originalFileIdentity && !originalFileIdentity.isRegularFile) {
    throw new Error('The upload destination must be a regular file.')
  }

  const directoryPath = path.join(
    path.dirname(filePath),
    `.payload-upload-rollback-${randomUUID()}`,
  )

  await fs.mkdir(directoryPath, { mode: 0o700 })
  const rollback: UploadFileRollback = {
    directoryPath,
    expectedDestinationFileIdentity: originalFileIdentity,
    filePath,
    publicationState: 'not-published',
    publishQueue: Promise.resolve(),
    stagedFilePaths: new Set(),
  }

  if (!originalFileIdentity) {
    return rollback
  }

  const backupFilePath = path.join(directoryPath, 'backup')

  try {
    await fs.copyFile(filePath, backupFilePath, constants.COPYFILE_EXCL)

    const [currentOriginalFileIdentity, backupFileIdentity] = await Promise.all([
      getFileIdentity({ filePath }),
      getFileIdentity({ filePath: backupFilePath }),
    ])

    if (
      !hasFileIdentity({ actual: currentOriginalFileIdentity, expected: originalFileIdentity }) ||
      !backupFileIdentity
    ) {
      throw new Error('The upload file changed while its rollback backup was being created.')
    }

    rollback.backupFileIdentity = backupFileIdentity
    rollback.backupFilePath = backupFilePath
    return rollback
  } catch (error) {
    await fs.rm(directoryPath, { force: true, recursive: true }).catch(() => undefined)
    throw error
  }
}

const rollbackUploadFile = async ({
  rollback,
}: {
  rollback: UploadFileRollback
}): Promise<void> => {
  if (rollback.publicationState === 'not-published') {
    return
  }

  if (
    rollback.publicationState === 'failed' ||
    rollback.publicationState === 'indeterminate' ||
    !rollback.uploadedFileIdentity
  ) {
    throw new Error('The published upload could not be identified safely for rollback.')
  }

  const quarantinedFilePath = path.join(rollback.directoryPath, `published-${randomUUID()}`)

  try {
    await fs.rename(rollback.filePath, quarantinedFilePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await restoreBackupIfPresent({ rollback })
      return
    }

    throw error
  }

  const quarantinedFileIdentity = await getFileIdentity({ filePath: quarantinedFilePath })

  if (
    !hasRenameStableFileIdentity({
      actual: quarantinedFileIdentity,
      expected: rollback.uploadedFileIdentity,
    })
  ) {
    await linkFileWithoutOverwrite({
      sourceFilePath: quarantinedFilePath,
      targetFilePath: rollback.filePath,
    })
    return
  }

  await restoreBackupIfPresent({ rollback })
}

const quarantineUploadDestination = async ({
  rollback,
}: {
  rollback: UploadFileRollback
}): Promise<{ fileIdentity: FileIdentity; filePath: string } | undefined> => {
  const quarantinedFilePath = path.join(rollback.directoryPath, `destination-${randomUUID()}`)

  try {
    await fs.rename(rollback.filePath, quarantinedFilePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined
    }

    throw error
  }

  const fileIdentity = await getFileIdentity({ filePath: quarantinedFilePath })

  if (!fileIdentity) {
    throw new Error('The upload destination was not present after it was quarantined.')
  }

  return { fileIdentity, filePath: quarantinedFilePath }
}

const restoreQuarantinedUploadDestination = async ({
  quarantinedDestination,
  rollback,
}: {
  quarantinedDestination: { fileIdentity: FileIdentity; filePath: string }
  rollback: UploadFileRollback
}): Promise<void> => {
  await linkFileWithoutOverwrite({
    sourceFilePath: quarantinedDestination.filePath,
    targetFilePath: rollback.filePath,
  })
}

const restoreBackupIfPresent = async ({
  rollback,
}: {
  rollback: UploadFileRollback
}): Promise<void> => {
  if (!rollback.backupFileIdentity || !rollback.backupFilePath) {
    return
  }

  const currentBackupFileIdentity = await getFileIdentity({ filePath: rollback.backupFilePath })

  if (
    !hasFileIdentity({
      actual: currentBackupFileIdentity,
      expected: rollback.backupFileIdentity,
    })
  ) {
    throw new Error('The upload rollback backup no longer belongs to this operation.')
  }

  await linkFileWithoutOverwrite({
    sourceFilePath: rollback.backupFilePath,
    targetFilePath: rollback.filePath,
  })
}

const throwCollectedErrors = ({ errors }: { errors: unknown[] }): void => {
  if (errors.length === 1) {
    throw errors[0]
  }

  if (errors.length > 1) {
    throw new AggregateError(errors, 'Multiple upload rollback tasks failed.')
  }
}
