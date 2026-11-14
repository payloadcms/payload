import type { JsonObject } from '../../../types/index.js'
import type { TypeWithID } from '../../config/types.js'

type DocWithLocales = JsonObject & TypeWithID

const getStatusForLocale = ({ locale, status }: { locale?: string; status: unknown }): unknown => {
  if (
    status &&
    typeof status === 'object' &&
    !Array.isArray(status) &&
    typeof locale === 'string' &&
    locale !== 'all'
  ) {
    return (status as Record<string, unknown>)[locale]
  }

  return status
}

const isPublishedStatus = (status: unknown): boolean => {
  if (status === 'published') {
    return true
  }

  if (status && typeof status === 'object' && !Array.isArray(status)) {
    return Object.values(status as Record<string, unknown>).includes('published')
  }

  return false
}

const isDraftStatus = (status: unknown): boolean => {
  if (status === 'draft') {
    return true
  }

  if (status && typeof status === 'object' && !Array.isArray(status)) {
    const values = Object.values(status as Record<string, unknown>)

    // locale `all` / whole-object fallback: any draft means a pending draft exists
    return values.length > 0 && values.includes('draft')
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
 * Explicit draft/publish requests (including explicit `publishAllLocales`) still use the
 * pending draft as the base. Generated `_status` from draft saves / unpublish-all also
 * uses the latest version; a generated publish status alone must not.
 */
export const resolveTrashRestoreDocs = ({
  data,
  latestVersionDoc,
  locale,
  mainDoc,
  publishAllLocales,
  requestedStatus,
}: {
  data: JsonObject
  latestVersionDoc: DocWithLocales
  locale?: string
  mainDoc: DocWithLocales | null | undefined
  /**
   * Explicit `publishAllLocales: true` from the caller. Do not pass the resolved default —
   * locale `all` can default-publish and overwrite `data._status` before this runs.
   */
  publishAllLocales?: boolean
  /**
   * Caller's `_status` before updateDocument may generate one for draft / publish-all /
   * unpublish-all. Prefer this over `data._status` for publish intent.
   */
  requestedStatus?: unknown
}): {
  docWithLocales: DocWithLocales
  versionDocWithLocales?: DocWithLocales
} => {
  // `data._status === 'draft'` still covers generated draft from `draft: true` / unpublish-all.
  // Publish intent must come from the caller's original `_status` or explicit publishAllLocales —
  // a generated `data._status === 'published'` (locale `all` default) must not select the draft.
  if (
    !mainDoc ||
    data._status === 'draft' ||
    requestedStatus === 'draft' ||
    requestedStatus === 'published' ||
    publishAllLocales
  ) {
    return { docWithLocales: latestVersionDoc }
  }

  const mainStatus = getStatusForLocale({ locale, status: mainDoc._status })
  const latestStatus = getStatusForLocale({ locale, status: latestVersionDoc._status })

  if (isPublishedStatus(mainStatus) && isDraftStatus(latestStatus)) {
    return {
      docWithLocales: mainDoc,
      versionDocWithLocales: latestVersionDoc,
    }
  }

  return { docWithLocales: latestVersionDoc }
}
