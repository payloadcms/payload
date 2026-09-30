import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { deleteAssociatedFiles } from './deleteAssociatedFiles.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  deleteFromAdapter?: boolean
  req: PayloadRequest
  retainedDoc?: null | Record<string, unknown>
  sourceDoc: Record<string, unknown>
}

/** Deletes upload files referenced by `sourceDoc` only when `retainedDoc` does not use them. */
export const deleteUploadFilesExclusiveToDocument = async ({
  collectionConfig,
  config,
  deleteFromAdapter = true,
  req,
  retainedDoc,
  sourceDoc,
}: Args): Promise<void> => {
  if (!collectionConfig.upload) {
    return
  }

  const retainedFilenames = getUploadFilenames(retainedDoc)
  const doc = filterDocumentFiles({ retainedFilenames, sourceDoc })

  if (getUploadFilenames(doc).size > 0) {
    await deleteAssociatedFiles({
      collectionConfig,
      config,
      doc,
      overrideDelete: true,
      req,
    })
  }

  if (deleteFromAdapter) {
    await collectionConfig.upload.deleteFiles?.({ req, retainedDoc, sourceDoc })
  }
}

const filterDocumentFiles = ({
  retainedFilenames,
  sourceDoc,
}: {
  retainedFilenames: Set<string>
  sourceDoc: Record<string, unknown>
}): Record<string, unknown> => {
  const sourceFilename =
    typeof sourceDoc.filename === 'string' && !retainedFilenames.has(sourceDoc.filename)
      ? sourceDoc.filename
      : undefined
  const sourceSizes = isRecord(sourceDoc.sizes) ? sourceDoc.sizes : {}
  const sizes = Object.fromEntries(
    Object.entries(sourceSizes).filter(([, size]) => {
      if (!isRecord(size) || typeof size.filename !== 'string') {
        return false
      }

      return !retainedFilenames.has(size.filename)
    }),
  )

  return {
    ...sourceDoc,
    filename: sourceFilename,
    sizes,
  }
}

const getUploadFilenames = (doc?: null | Record<string, unknown>): Set<string> => {
  const filenames = new Set<string>()

  if (!doc) {
    return filenames
  }

  if (typeof doc.filename === 'string') {
    filenames.add(doc.filename)
  }

  if (isRecord(doc.sizes)) {
    for (const size of Object.values(doc.sizes)) {
      if (isRecord(size) && typeof size.filename === 'string') {
        filenames.add(size.filename)
      }
    }
  }

  return filenames
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
