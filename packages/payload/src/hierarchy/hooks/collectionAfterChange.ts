/**
 * afterChange Hook Responsibilities:
 * - Update OTHER locales for this document (when parent changes and field is localized)
 * - Update ALL descendants of this document (when parent or title changes)
 * - Handle draft versions if versioning is enabled
 *
 * Does NOT handle:
 * - Current request locale for this document (handled by beforeChange)
 */

import type { CollectionAfterChangeHook, SelectIncludeType } from '../../index.js'

import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { computeTreeData } from '../utils/computeTreeData.js'
import { getTreeChanges } from '../utils/getTreeChanges.js'
import { updateDescendants } from '../utils/updateDescendants.js'

type Args = {
  /**
   * Whether to generate path fields
   */
  generatePaths?: boolean
  /**
   * Indicates whether the title field is localized
   */
  isTitleLocalized?: boolean
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName?: string
  slugify?: (text: string) => string
  /**
   * The name of the field that contains the slug path
   *
   * example: "parent-folder/current-folder"
   */
  slugPathFieldName?: string
  /**
   * The name of the field that contains the title used to generate the paths
   */
  titleFieldName?: string
  /**
   * The name of the field that contains the title path
   *
   * example: "Parent Folder/Current Folder"
   */
  titlePathFieldName?: string
}
export const hierarchyCollectionAfterChange =
  ({
    generatePaths,
    isTitleLocalized,
    parentFieldName,
    slugify,
    slugPathFieldName,
    titleFieldName,
    titlePathFieldName,
  }: Required<Args>): CollectionAfterChangeHook =>
  async ({
    collection,
    doc,
    docWithLocales,
    operation,
    previousDoc,
    previousDocWithLocales,
    req,
  }) => {
    const reqLocale =
      req.locale ||
      (req.payload.config.localization ? req.payload.config.localization.defaultLocale : undefined)

    // Skip hierarchy processing when locale is 'all'
    // This is a defensive check: req.locale should not be 'all' in normal operations,
    // as it's only used internally for database operations that update all locales at once.
    // If this check triggers, it indicates the operation is updating all locales simultaneously,
    // and processing each locale individually could cause conflicts.
    if (reqLocale === 'all') {
      return
    }

    // Skip hierarchy processing if this update is coming from updateDescendants
    // to avoid infinite recursion and overwriting hierarchy fields
    if (req.context?.hierarchyUpdating) {
      return
    }

    const { newParentID, parentChanged, titleChanged } = getTreeChanges({
      doc,
      isTitleLocalized,
      parentFieldName,
      previousDoc,
      reqLocale,
      slugify,
      titleFieldName,
    })

    // Validate circular references when parent is changing
    if (parentChanged && newParentID) {
      // Prevent self-referential parent
      if (newParentID === doc.id) {
        throw new Error('Document cannot be its own parent')
      }

      // Prevent circular references by checking if the new parent is a descendant of this document
      // We need to query the new parent to get its current _h_parentTree
      const newParentDoc = await req.payload.findByID({
        id: newParentID,
        collection: collection.slug,
        depth: 0,
        req,
        select: {
          _h_parentTree: true,
        },
      })

      if (
        Array.isArray(newParentDoc._h_parentTree) &&
        newParentDoc._h_parentTree.includes(doc.id)
      ) {
        throw new Error(
          'Circular reference detected: the new parent is a descendant of this document',
        )
      }
    }

    const parentChangedOrCreate = parentChanged || operation === 'create'

    // Only process if parent changed/created, or if title changed and paths are enabled
    if (parentChangedOrCreate || (titleChanged && generatePaths)) {
      const updatedTreeData = await computeTreeData({
        collection,
        docWithLocales,
        fieldIsLocalized: isTitleLocalized,
        localeCodes:
          isTitleLocalized && req.payload.config.localization
            ? req.payload.config.localization.localeCodes
            : undefined,
        newParentID,
        parentChanged: parentChangedOrCreate,
        parentFieldName,
        previousDocWithLocales,
        req,
        reqLocale:
          reqLocale ||
          (req.payload.config.localization ? req.payload.config.localization.defaultLocale : 'en'),
        slugify,
        slugPathFieldName,
        titleFieldName,
        titlePathFieldName,
      })

      // Build previousDocWithPaths by computing what the paths were before this update
      // We can't fetch from the database because this is an afterChange hook and the document
      // has already been updated. Instead, we compute the old paths from the previousDoc data.
      let previousDocWithPaths = previousDocWithLocales
      if (generatePaths && operation === 'update' && previousDoc) {
        // Compute the previous paths by combining parent path + document's title
        // Use previousDocWithLocales to get all locale data, not just current locale
        const previousTitle = previousDocWithLocales[titleFieldName]

        // Skip if previousTitle is undefined (happens when setting a locale for the first time)
        if (!previousTitle) {
          // Use current document paths as previous (no change for this locale yet)
          previousDocWithPaths = previousDocWithLocales
        } else {
          if (previousDocWithLocales[parentFieldName]) {
            // Document has a parent - fetch parent's path and combine with document's old title
            const previousParentDoc = await req.payload.findByID({
              id: previousDocWithLocales[parentFieldName],
              collection: collection.slug,
              depth: 0,
              locale: 'all',
              req,
            })

            if (isTitleLocalized && req.payload.config.localization) {
              const slugPathByLocale: Record<string, string> = {}
              const titlePathByLocale: Record<string, string> = {}

              for (const locale of req.payload.config.localization.localeCodes) {
                const parentSlugPath = previousParentDoc[slugPathFieldName][locale] || ''
                const parentTitlePath = previousParentDoc[titlePathFieldName][locale] || ''
                const docTitle =
                  typeof previousTitle === 'string' ? previousTitle : previousTitle[locale] || ''
                const docSlug = slugify(docTitle)

                slugPathByLocale[locale] = parentSlugPath ? `${parentSlugPath}/${docSlug}` : docSlug
                titlePathByLocale[locale] = parentTitlePath
                  ? `${parentTitlePath}/${docTitle}`
                  : docTitle
              }

              previousDocWithPaths = {
                ...previousDocWithLocales,
                [slugPathFieldName]: slugPathByLocale,
                [titlePathFieldName]: titlePathByLocale,
              }
            } else {
              const previousSlug = slugify(previousTitle as string)
              const parentSlugPath = previousParentDoc[slugPathFieldName] || ''
              const parentTitlePath = previousParentDoc[titlePathFieldName] || ''

              previousDocWithPaths = {
                ...previousDocWithLocales,
                [slugPathFieldName]: parentSlugPath
                  ? `${parentSlugPath}/${previousSlug}`
                  : previousSlug,
                [titlePathFieldName]: parentTitlePath
                  ? `${parentTitlePath}/${previousTitle}`
                  : previousTitle,
              }
            }
          } else {
            // Document is a root (no parent) - just use the document's old title as the path
            if (isTitleLocalized && req.payload.config.localization) {
              const slugPathByLocale: Record<string, string> = {}
              const titlePathByLocale: Record<string, string> = {}

              for (const locale of req.payload.config.localization.localeCodes) {
                const docTitle =
                  typeof previousTitle === 'string' ? previousTitle : previousTitle[locale] || ''
                const docSlug = slugify(docTitle)

                slugPathByLocale[locale] = docSlug
                titlePathByLocale[locale] = docTitle
              }

              previousDocWithPaths = {
                ...previousDocWithLocales,
                [slugPathFieldName]: slugPathByLocale,
                [titlePathFieldName]: titlePathByLocale,
              }
            } else {
              const previousSlug = slugify(previousTitle as string)

              previousDocWithPaths = {
                ...previousDocWithLocales,
                [slugPathFieldName]: previousSlug,
                [titlePathFieldName]: previousTitle,
              }
            }
          }
        }
      }

      // Build select fields for querying updated document
      const selectFields: SelectIncludeType = {
        _h_depth: true,
        _h_parentTree: true,
        [titleFieldName]: true, // Include title field for path computation
      }

      if (generatePaths) {
        selectFields[slugPathFieldName] = true
        selectFields[titlePathFieldName] = true
      }

      // Fetch the updated document with all locales to pass to descendants
      // The current locale's hierarchy fields were already updated by beforeChange hook
      let updatedDocWithLocales = await req.payload.findByID({
        id: doc.id,
        collection: collection.slug,
        depth: 0,
        locale: 'all',
        req,
        select: selectFields,
      })

      // For localized fields, compute paths for OTHER locales when parent changes
      // Current locale was already handled by beforeChange hook
      if (
        generatePaths &&
        isTitleLocalized &&
        req.payload.config.localization &&
        parentChangedOrCreate
      ) {
        const localeCodes = req.payload.config.localization.localeCodes
        const currentLocale = req.context.hierarchyCurrentLocale

        // Start with existing paths to preserve locales not being updated
        const currentSlugPaths = updatedDocWithLocales[slugPathFieldName] || {}
        const currentTitlePaths = updatedDocWithLocales[titlePathFieldName] || {}

        const slugPathByLocale: Record<string, string> = { ...currentSlugPaths }
        const titlePathByLocale: Record<string, string> = { ...currentTitlePaths }

        // Compute paths for OTHER locales (current locale was handled by beforeChange)
        for (const locale of localeCodes) {
          // Skip current locale - already handled by beforeChange
          if (locale === currentLocale) {
            continue
          }

          // Only compute if this locale has title data
          const titleValue = updatedDocWithLocales[titleFieldName]
          const hasTitleForLocale =
            titleValue && typeof titleValue === 'object' && titleValue[locale]

          if (hasTitleForLocale) {
            const localeTreeData = await computeTreeData({
              collection,
              docWithLocales: updatedDocWithLocales,
              fieldIsLocalized: isTitleLocalized,
              localeCodes: [locale],
              newParentID,
              parentChanged: parentChangedOrCreate,
              parentFieldName,
              previousDocWithLocales,
              req,
              reqLocale: locale,
              slugify,
              slugPathFieldName,
              titleFieldName,
              titlePathFieldName,
            })

            // Extract the locale-specific string values
            const localeSlugPath =
              typeof localeTreeData.slugPath === 'object'
                ? localeTreeData.slugPath[locale]
                : localeTreeData.slugPath
            const localeTitlePath =
              typeof localeTreeData.titlePath === 'object'
                ? localeTreeData.titlePath[locale]
                : localeTreeData.titlePath

            if (localeSlugPath !== undefined) {
              slugPathByLocale[locale] = localeSlugPath
            }
            if (localeTitlePath !== undefined) {
              titlePathByLocale[locale] = localeTitlePath
            }
          }
        }

        // Update all locales at once via db.updateOne with locale: 'all'
        // db operations expect localized data (objects with locale keys)
        await req.payload.db.updateOne({
          id: doc.id,
          collection: collection.slug,
          data: {
            [slugPathFieldName]: slugPathByLocale,
            [titlePathFieldName]: titlePathByLocale,
          },
          locale: 'all',
          req,
        })

        // Re-fetch to get the updated paths for all locales
        updatedDocWithLocales = await req.payload.findByID({
          id: doc.id,
          collection: collection.slug,
          depth: 0,
          locale: 'all',
          req,
          select: selectFields,
        })
      }

      // Update all descendants in batches to handle unlimited tree sizes
      await updateDescendants({
        collection,
        fieldIsLocalized: isTitleLocalized,
        generatePaths,
        localeCodes:
          isTitleLocalized && req.payload.config.localization
            ? req.payload.config.localization.localeCodes
            : undefined,
        newParentID: newParentID ?? undefined,
        parentDocID: doc.id,
        parentDocWithLocales: updatedDocWithLocales,
        parentFieldName,
        previousParentDocWithLocales: previousDocWithPaths,
        req,
        slugPathFieldName,
        titlePathFieldName,
      })

      // No need to modify doc - beforeChange hook already set the correct values
      // which were persisted in the initial DB write
      return doc
    }
  }
