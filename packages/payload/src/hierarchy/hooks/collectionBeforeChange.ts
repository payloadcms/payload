/**
 * beforeChange Hook Responsibilities:
 * - Update hierarchy fields for THIS document only
 * - Handle ONLY the current request locale
 * - Compute: _h_depth, _h_parentTree, paths (if enabled)
 * - Set values on `data` object so they are persisted to database
 * - Validate circular references
 *
 * Does NOT handle:
 * - Other locales (handled by afterChange when parent changes)
 * - Descendants (handled by afterChange)
 */

import type { CollectionBeforeChangeHook } from '../../index.js'

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
      isTitleLocalized,
      parentFieldName,
      previousDoc: originalDoc,
      reqLocale,
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

      if (
        Array.isArray(newParentDoc._h_parentTree) &&
        newParentDoc._h_parentTree.includes(fullDoc.id)
      ) {
        throw new Error(
          'Circular reference detected: the new parent is a descendant of this document',
        )
      }
    }

    const parentChangedOrCreate = parentChanged || operation === 'create'

    // Only process if parent changed/created, or if title changed and paths are enabled
    if (parentChangedOrCreate || (titleChanged && generatePaths)) {
      // Compute parent tree and depth
      let newParentTree: Array<number | string> = []
      if (newParentID) {
        const parentDoc = await req.payload.findByID({
          id: newParentID,
          collection: collection.slug,
          depth: 0,
          req,
          select: {
            _h_parentTree: true,
          },
        })
        newParentTree = [
          ...(Array.isArray(parentDoc._h_parentTree) ? parentDoc._h_parentTree : []),
          newParentID,
        ]
      }

      // Update non-localized hierarchy fields
      data._h_depth = newParentTree.length
      data._h_parentTree = newParentTree

      if (parentChanged) {
        data[parentFieldName] = newParentID
      }

      // Compute and set path fields if enabled
      if (generatePaths) {
        const currentTitle = data[titleFieldName]
        if (!currentTitle) {
          return data
        }

        const currentSlug = slugify(currentTitle)

        // Fetch parent's paths if document has a parent
        let parentSlugPath = ''
        let parentTitlePath = ''

        if (newParentID) {
          const parentDoc = await req.payload.findByID({
            id: newParentID,
            collection: collection.slug,
            depth: 0,
            locale: reqLocale,
            req,
            select: {
              [slugPathFieldName]: true,
              [titlePathFieldName]: true,
            },
          })

          if (isTitleLocalized) {
            parentSlugPath = parentDoc[slugPathFieldName] || ''
            parentTitlePath = parentDoc[titlePathFieldName] || ''
          } else {
            parentSlugPath = parentDoc[slugPathFieldName] || ''
            parentTitlePath = parentDoc[titlePathFieldName] || ''
          }
        }

        // Compute this document's paths
        const computedSlugPath = parentSlugPath ? `${parentSlugPath}/${currentSlug}` : currentSlug
        const computedTitlePath = parentTitlePath
          ? `${parentTitlePath}/${currentTitle}`
          : currentTitle

        // Set path fields - Payload will nest under locale key if localized
        data[slugPathFieldName] = computedSlugPath
        data[titlePathFieldName] = computedTitlePath

        // Store current locale in context for afterChange
        if (isTitleLocalized) {
          req.context.hierarchyCurrentLocale = reqLocale
        }
      }
    }

    return data
  }
