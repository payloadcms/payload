import type { CollectionBeforeChangeHook } from '../../index.js'

import { computeTreeData } from '../utils/computeTreeData.js'
import { getTreeChanges } from '../utils/getTreeChanges.js'

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

export const hierarchyCollectionBeforeChange =
  ({
    generatePaths,
    isTitleLocalized,
    parentFieldName,
    slugify,
    slugPathFieldName,
    titleFieldName,
    titlePathFieldName,
  }: Required<Args>): CollectionBeforeChangeHook =>
  async ({ collection, data, operation, originalDoc, req }) => {
    const reqLocale =
      req.locale ||
      (req.payload.config.localization ? req.payload.config.localization.defaultLocale : undefined)

    // Skip hierarchy processing when locale is 'all'
    if (reqLocale === 'all') {
      return data
    }

    // Skip hierarchy processing if this update is coming from updateDescendants
    // to avoid infinite recursion and overwriting hierarchy fields
    if (req.context?.hierarchyUpdating) {
      return data
    }

    // Merge originalDoc and data to create the full document for tree change detection
    const fullDoc = { ...originalDoc, ...data }

    const { newParentID, parentChanged, titleChanged } = getTreeChanges({
      doc: fullDoc,
      parentFieldName,
      previousDoc: originalDoc,
      slugify,
      titleFieldName,
    })

    // Validate circular references when parent is changing
    if (parentChanged && newParentID) {
      // Prevent self-referential parent
      if (newParentID === fullDoc.id) {
        throw new Error('Document cannot be its own parent')
      }

      // Prevent circular references by checking if the new parent is a descendant of this document
      const newParentDoc = await req.payload.findByID({
        id: newParentID,
        collection: collection.slug,
        depth: 0,
        req,
        select: {
          _h_parentTree: true,
        },
      })

      if (newParentDoc._h_parentTree && newParentDoc._h_parentTree.includes(fullDoc.id)) {
        throw new Error(
          'Circular reference detected: the new parent is a descendant of this document',
        )
      }
    }

    const parentChangedOrCreate = parentChanged || operation === 'create'

    // Only process if parent changed/created, or if title changed and paths are enabled
    if (parentChangedOrCreate || (titleChanged && generatePaths)) {
      // Fetch document with all locales to pass to computeTreeData
      // For creates, we don't have a document yet, so we construct one from data
      let docWithLocales = fullDoc
      if (operation === 'update' && fullDoc.id) {
        docWithLocales = await req.payload.findByID({
          id: fullDoc.id,
          collection: collection.slug,
          depth: 0,
          locale: 'all',
          req,
        })
        // Merge the update data, handling localized fields correctly
        const safeReqLocale =
          reqLocale ||
          (req.payload.config.localization ? req.payload.config.localization.defaultLocale : 'en')

        // For localized title field, nest the value under the current locale
        if (isTitleLocalized && data[titleFieldName] !== undefined) {
          docWithLocales[titleFieldName] = {
            ...docWithLocales[titleFieldName],
            [safeReqLocale]: data[titleFieldName],
          }
        }

        // Merge other non-localized fields
        for (const key in data) {
          if (key !== titleFieldName) {
            docWithLocales[key] = data[key]
          }
        }
      }

      // Compute tree data for current locale only
      const updatedTreeData = await computeTreeData({
        collection,
        docWithLocales,
        fieldIsLocalized: isTitleLocalized,
        localeCodes:
          isTitleLocalized && req.payload.config.localization
            ? [reqLocale || req.payload.config.localization.defaultLocale]
            : undefined,
        newParentID,
        parentChanged: parentChangedOrCreate,
        parentFieldName,
        previousDocWithLocales: originalDoc || {},
        req,
        reqLocale:
          reqLocale ||
          (req.payload.config.localization ? req.payload.config.localization.defaultLocale : 'en'),
        slugify,
        slugPathFieldName,
        titleFieldName,
        titlePathFieldName,
      })

      // Update data with new values (non-localized fields only)
      data._h_depth = updatedTreeData._h_parentTree?.length ?? 0
      data._h_parentTree = updatedTreeData._h_parentTree

      if (parentChanged) {
        data[parentFieldName] = newParentID
      }

      if (generatePaths) {
        if (isTitleLocalized) {
          // For localized fields, set as strings (non-localized format)
          // Payload will nest them under the locale key during DB write
          const safeReqLocale =
            reqLocale ||
            (req.payload.config.localization ? req.payload.config.localization.defaultLocale : 'en')

          const computedSlugPath =
            typeof updatedTreeData.slugPath === 'object'
              ? updatedTreeData.slugPath[safeReqLocale]
              : updatedTreeData.slugPath

          const computedTitlePath =
            typeof updatedTreeData.titlePath === 'object'
              ? updatedTreeData.titlePath[safeReqLocale]
              : updatedTreeData.titlePath

          // Set as strings - Payload will nest under locale key
          data[slugPathFieldName] = computedSlugPath
          data[titlePathFieldName] = computedTitlePath

          // Store in context so afterChange knows to only update OTHER locales when parent changes
          req.context.hierarchyCurrentLocale = safeReqLocale
        } else {
          // For non-localized fields, set directly
          data[slugPathFieldName] = updatedTreeData.slugPath
          data[titlePathFieldName] = updatedTreeData.titlePath
        }
      }
    }

    return data
  }
