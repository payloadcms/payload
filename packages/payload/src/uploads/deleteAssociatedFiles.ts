import fs from 'fs/promises'
import { status as httpStatus } from 'http-status'
import path from 'path'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileToSave } from './types.js'

import { APIError, ErrorDeletingFile } from '../errors/index.js'
import { fileExists } from './fileExists.js'
import { getReferencedUploadFilenames } from './getReferencedUploadFilenames.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  doc: Record<string, unknown>
  filenamesToPreserve?: ReadonlySet<string>
  files?: FileToSave[]
  overrideDelete: boolean
  req: PayloadRequest
}

export const deleteAssociatedFiles: (args: Args) => Promise<void> = async ({
  collectionConfig,
  doc,
  filenamesToPreserve,
  files = [],
  overrideDelete,
  req,
}) => {
  if (!collectionConfig.upload) {
    return
  }
  if (overrideDelete || files.length > 0) {
    const { staticDir: staticPath } = collectionConfig.upload

    const filenames = getReferencedUploadFilenames({ collectionConfig, doc })

    for (const filename of filenames) {
      if (filenamesToPreserve?.has(filename)) {
        continue
      }

      const filePath = resolveFilePath({ filename, staticPath })

      try {
        await deleteFile({ filePath, staticPath })
      } catch (ignore) {
        throw new ErrorDeletingFile(req.t)
      }
    }
  }
}

const resolveFilePath = ({
  filename,
  staticPath,
}: {
  filename?: null | string
  staticPath?: string
}) => {
  if (!filename || !staticPath) {
    return
  }

  const resolvedDir = path.resolve(staticPath)
  const filePath = path.resolve(resolvedDir, filename)

  if (!isWithinDirectory({ directory: resolvedDir, target: filePath })) {
    throw new APIError('Invalid filename.', httpStatus.BAD_REQUEST)
  }

  return filePath
}

const deleteFile = async ({ filePath, staticPath }: { filePath?: string; staticPath?: string }) => {
  if (!filePath || !staticPath) {
    return
  }

  if (!(await fileExists(filePath))) {
    return
  }

  const [resolvedDir, resolvedParent] = await Promise.all([
    fs.realpath(staticPath),
    fs.realpath(path.dirname(filePath)),
  ])
  const resolvedTarget = path.join(resolvedParent, path.basename(filePath))

  if (!isWithinDirectory({ directory: resolvedDir, target: resolvedTarget })) {
    throw new APIError('Invalid filename.', httpStatus.BAD_REQUEST)
  }

  await fs.unlink(filePath)
}

const isWithinDirectory = ({ directory, target }: { directory: string; target: string }) => {
  const relativePath = path.relative(directory, target)

  return (
    relativePath === '' ||
    (relativePath !== '..' &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath))
  )
}
