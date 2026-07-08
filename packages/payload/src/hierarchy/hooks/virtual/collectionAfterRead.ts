/**
 * Virtual strategy afterRead hook.
 *
 * Responsibilities:
 * - Compute `_h_slugPath` and `_h_titlePath` on read
 * - Use ancestor caching for repeated reads
 * - Only compute when explicitly requested via context/query/select
 */

import type { CollectionAfterReadHook } from '../../../index.js'

import { computePaths } from '../../utils/computePaths.js'
import { findUseAsTitleField } from '../../utils/findUseAsTitle.js'
import { isDocumentDraft } from '../../utils/isDocumentDraft.js'
import { isPathFieldSelectedFromRequest } from './utils/pathFieldSelection.js'

type Args = {
  parentFieldName: string
  slugPathFieldName: string
  titlePathFieldName: string
}

export const collectionAfterReadVirtual =
  ({ parentFieldName, slugPathFieldName, titlePathFieldName }: Args): CollectionAfterReadHook =>
  async ({ collection, context, doc, req }) => {
    if (context?.isDeleting) {
      return doc
    }

    const shouldComputePaths =
      context?.computeHierarchyPaths === true ||
      context?.computeHierarchyPathsViaSelect === true ||
      req.query?.computeHierarchyPaths === 'true' ||
      isPathFieldSelectedFromRequest({ req, slugPathFieldName, titlePathFieldName })

    if (!shouldComputePaths) {
      return doc
    }

    try {
      const { localized: isTitleLocalized } = findUseAsTitleField(collection)

      const { slugPath, titlePath } = await computePaths({
        collection,
        doc,
        draft: isDocumentDraft({
          doc,
          locale:
            req.locale === 'all'
              ? undefined
              : req.locale || req.payload.config.localization?.defaultLocale,
        }),
        locale:
          isTitleLocalized && req.locale === 'all'
            ? 'all'
            : req.locale === 'all'
              ? undefined
              : req.locale || undefined,
        parentFieldName,
        req,
        slugPathFieldName,
        titlePathFieldName,
      })

      doc[slugPathFieldName] = slugPath
      doc[titlePathFieldName] = titlePath
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to compute hierarchy paths for document ${doc.id}:`, error)
    }

    const autoAddedFields = context?.hierarchyAutoSelectedFields as string[] | undefined
    if (
      autoAddedFields &&
      autoAddedFields.length > 0 &&
      context?.preserveHierarchyAutoSelectedFields !== true
    ) {
      for (const fieldName of autoAddedFields) {
        delete doc[fieldName]
      }
    }

    return doc
  }
