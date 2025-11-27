import type { CollectionAfterChangeHook, SelectIncludeType } from '../../index.js'

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

    // handle this better later
    if (reqLocale === 'all') {
      return
    }

    const { newParentID, parentChanged, titleChanged } = getTreeChanges({
      doc,
      parentFieldName,
      previousDoc,
      slugify,
      titleFieldName,
    })

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

      // Build update data
      const updateData: Record<string, any> = {
        _h_depth: updatedTreeData._h_parentTree?.length ?? 0,
        _h_parentTree: updatedTreeData._h_parentTree,
        [parentFieldName]: newParentID,
      }

      // Only include path fields if generatePaths is true
      if (generatePaths) {
        updateData[slugPathFieldName] = updatedTreeData.slugPath
        updateData[titlePathFieldName] = updatedTreeData.titlePath
      }

      // Build select fields
      const selectFields: SelectIncludeType = {
        _h_depth: true,
        _h_parentTree: true,
      }

      if (generatePaths) {
        selectFields[slugPathFieldName] = true
        selectFields[titlePathFieldName] = true
      }

      // NOTE: using the db directly, no hooks or access control here
      const updatedDocWithLocales = await req.payload.db.updateOne({
        id: doc.id,
        collection: collection.slug,
        data: updateData,
        locale: 'all',
        req,
        select: selectFields,
      })

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
        previousParentDocWithLocales: previousDocWithLocales,
        req,
        slugPathFieldName,
        titlePathFieldName,
      })

      // Update doc with new values
      if (generatePaths) {
        const updatedSlugPath = isTitleLocalized
          ? updatedDocWithLocales[slugPathFieldName][reqLocale!]
          : updatedDocWithLocales[slugPathFieldName]
        const updatedTitlePath = isTitleLocalized
          ? updatedDocWithLocales[titlePathFieldName][reqLocale!]
          : updatedDocWithLocales[titlePathFieldName]

        if (updatedSlugPath) {
          doc[slugPathFieldName] = updatedSlugPath
        }
        if (updatedTitlePath) {
          doc[titlePathFieldName] = updatedTitlePath
        }
      }

      if (parentChangedOrCreate) {
        const updatedParentTree = updatedDocWithLocales._h_parentTree
        doc._h_parentTree = updatedParentTree
        doc._h_depth = updatedParentTree ? updatedParentTree.length : 0
      }

      return doc
    }
  }
