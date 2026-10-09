import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { FileIdentity } from './fileIdentity.js'

import { getFileIdentity } from './fileIdentity.js'
import { linkFileWithoutOverwrite } from './linkFileWithoutOverwrite.js'

export type QuarantinedFile = {
  directoryPath: string
  fileIdentity: FileIdentity
  filePath: string
}

export const quarantineFile = async ({
  filePath,
}: {
  filePath: string
}): Promise<QuarantinedFile | undefined> => {
  const directoryPath = path.join(
    path.dirname(filePath),
    `.payload-file-quarantine-${randomUUID()}`,
  )

  await fs.mkdir(directoryPath, { mode: 0o700 })
  const quarantinedFilePath = path.join(directoryPath, 'file')

  try {
    await fs.rename(filePath, quarantinedFilePath)
  } catch (error) {
    await fs.rm(directoryPath, { force: true, recursive: true }).catch(() => undefined)

    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined
    }

    throw error
  }

  const fileIdentity = await getFileIdentity({ filePath: quarantinedFilePath })

  if (!fileIdentity) {
    throw new Error('The quarantined file was not present after it was moved.')
  }

  return {
    directoryPath,
    fileIdentity,
    filePath: quarantinedFilePath,
  }
}

export const discardQuarantinedFile = async ({
  quarantinedFile,
}: {
  quarantinedFile: QuarantinedFile
}): Promise<void> => {
  await fs.rm(quarantinedFile.directoryPath, { force: true, recursive: true })
}

export const restoreQuarantinedFile = async ({
  quarantinedFile,
  targetFilePath,
}: {
  quarantinedFile: QuarantinedFile
  targetFilePath: string
}): Promise<void> => {
  await linkFileWithoutOverwrite({
    sourceFilePath: quarantinedFile.filePath,
    targetFilePath,
  })
  await discardQuarantinedFile({ quarantinedFile })
}
