import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'

import fs from 'node:fs/promises'

export type FileIdentity = {
  changeTimeNanoseconds: bigint
  device: bigint
  inode: bigint
  isRegularFile: boolean
  modificationTimeNanoseconds: bigint
  size: bigint
}

export const getFileIdentity = async ({
  filePath,
}: {
  filePath: string
}): Promise<FileIdentity | undefined> => {
  try {
    const stats = await fs.lstat(filePath, { bigint: true })

    return createFileIdentity({ stats })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined
    }

    throw error
  }
}

export const getFileHandleIdentity = async ({
  fileHandle,
}: {
  fileHandle: FileHandle
}): Promise<FileIdentity> => {
  const stats = await fileHandle.stat({ bigint: true })

  return createFileIdentity({ stats })
}

export const hasFileIdentity = ({
  actual,
  expected,
}: {
  actual: FileIdentity | undefined
  expected: FileIdentity
}): boolean =>
  actual !== undefined &&
  actual.changeTimeNanoseconds === expected.changeTimeNanoseconds &&
  actual.device === expected.device &&
  actual.inode === expected.inode &&
  actual.isRegularFile === expected.isRegularFile &&
  actual.modificationTimeNanoseconds === expected.modificationTimeNanoseconds &&
  actual.size === expected.size

export const hasRenameStableFileIdentity = ({
  actual,
  expected,
}: {
  actual: FileIdentity | undefined
  expected: FileIdentity
}): boolean =>
  actual !== undefined &&
  actual.device === expected.device &&
  actual.inode === expected.inode &&
  actual.isRegularFile === expected.isRegularFile &&
  actual.modificationTimeNanoseconds === expected.modificationTimeNanoseconds &&
  actual.size === expected.size

const createFileIdentity = ({ stats }: { stats: BigIntStats }): FileIdentity => ({
  changeTimeNanoseconds: stats.ctimeNs,
  device: stats.dev,
  inode: stats.ino,
  isRegularFile: stats.isFile(),
  modificationTimeNanoseconds: stats.mtimeNs,
  size: stats.size,
})
