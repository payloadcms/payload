import type { JsonObject } from '../../../types/index.js'
import type { TypeWithID } from '../../config/types.js'

type DocWithLocales = JsonObject & TypeWithID

const isPublishedStatus = (status: unknown): boolean => {
  if (status === 'published') {
    return true
  }

  if (status && typeof status === 'object') {
    return Object.values(status as Record<string, unknown>).includes('published')
  }

  return false
}

const isDraftStatus = (status: unknown): boolean => {
  if (status === 'draft') {
    return true
  }

  if (status && typeof status === 'object') {
    const values = Object.values(status as Record<string, unknown>)

    return values.length > 0 && values.every((value) => value === 'draft')
  }

  return false
}

/**
 * Trash/restore normally seed from the latest version so draft-only documents keep their
 * version-table data (#15981). When a published document also has a newer pending draft,
 * that would overwrite live main-document content with the draft (#19449).
 *
 * In that case, keep the published main document as the update base and version from the
 * pending draft so deletedAt is stamped on both without replacing published content.
 * Explicitly restoring as draft (`_status: 'draft'`) still uses the pending draft as the base.
 */
export const resolveTrashRestoreDocs = ({
  data,
  latestVersionDoc,
  mainDoc,
}: {
  data: JsonObject
  latestVersionDoc: DocWithLocales
  mainDoc: DocWithLocales | null | undefined
}): {
  docWithLocales: DocWithLocales
  versionDocWithLocales?: DocWithLocales
} => {
  if (!mainDoc || data._status === 'draft') {
    return { docWithLocales: latestVersionDoc }
  }

  if (isPublishedStatus(mainDoc._status) && isDraftStatus(latestVersionDoc._status)) {
    return {
      docWithLocales: mainDoc,
      versionDocWithLocales: latestVersionDoc,
    }
  }

  return { docWithLocales: latestVersionDoc }
}
