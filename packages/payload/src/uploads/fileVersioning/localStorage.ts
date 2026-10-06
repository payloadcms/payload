import fs from 'node:fs/promises'
import path from 'node:path'

import { normalizeStorageKey } from './naming.js'

type LocalFileOperationArgs = {
  from: string
  staticDir: string
  to: string
}

/** Copies a managed local object to a previously unused key. */
export const copyLocalFile = async ({
  from,
  staticDir,
  to,
}: LocalFileOperationArgs): Promise<void> => {
  const { destination, source } = await resolvePaths({ from, staticDir, to })

  await fs.copyFile(source, destination, fs.constants.COPYFILE_EXCL)
  await fs.stat(destination)
}

/** Moves a managed local object, using copy then delete across filesystems. */
export const moveLocalFile = async ({
  from,
  staticDir,
  to,
}: LocalFileOperationArgs): Promise<void> => {
  const { destination, source } = await resolvePaths({ from, staticDir, to })

  try {
    await fs.link(source, destination)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EXDEV') {
      throw err
    }

    await fs.copyFile(source, destination, fs.constants.COPYFILE_EXCL)
  }

  await fs.stat(destination)
  await fs.unlink(source)
}

const resolvePaths = async ({ from, staticDir, to }: LocalFileOperationArgs) => {
  const root = await fs.realpath(staticDir)
  const source = path.resolve(root, normalizeStorageKey({ key: from }))
  const destination = path.resolve(root, normalizeStorageKey({ key: to }))

  if (source === destination || !isWithinRoot({ root, target: source })) {
    throw new Error('Invalid local storage source')
  }
  if (!isWithinRoot({ root, target: destination })) {
    throw new Error('Invalid local storage destination')
  }

  const sourcePath = await fs.realpath(source)

  if (!isWithinRoot({ root, target: sourcePath })) {
    throw new Error('Local storage source escapes its directory')
  }

  await ensureSafeDestinationDirectory({ directory: path.dirname(destination), root })

  const destinationParent = await fs.realpath(path.dirname(destination))

  if (destinationParent !== root && !isWithinRoot({ root, target: destinationParent })) {
    throw new Error('Local storage path escapes its directory')
  }

  return { destination, source }
}

const ensureSafeDestinationDirectory = async ({
  directory,
  root,
}: {
  directory: string
  root: string
}): Promise<void> => {
  let current = root

  for (const segment of path.relative(root, directory).split(path.sep)) {
    if (!segment) {
      continue
    }

    current = path.join(current, segment)
    try {
      const entry = await fs.lstat(current)

      if (!entry.isDirectory() || entry.isSymbolicLink()) {
        throw new Error('Local storage destination contains a non-directory path')
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }

      await fs.mkdir(current)
    }
  }
}

const isWithinRoot = ({ root, target }: { root: string; target: string }): boolean =>
  target.startsWith(`${root}${path.sep}`)
