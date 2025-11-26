import type { CollectionAfterChangeHook } from '../../index.js'

import { fetchParentAndComputeTree } from '../utils/fetchParentAndComputeTree.js'
import { generateTreePaths } from '../utils/generateTreePaths.js'
import { getTreeChanges } from '../utils/getTreeChanges.js'
import { updateDescendants } from '../utils/updateDescendants.js'

type Args = {
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
    isTitleLocalized,
    parentFieldName,
    slugify,
    slugPathFieldName,
    titleFieldName,
    titlePathFieldName,
  }: Required<Args>): CollectionAfterChangeHook =>
  async ({ collection, doc, previousDoc, previousDocWithLocales, req }) => {
    const reqLocale =
      req.locale ||
      (req.payload.config.localization ? req.payload.config.localization.defaultLocale : undefined)

    // handle this better later
    if (reqLocale === 'all') {
      return
    }

    const { newParentID, parentChanged, prevParentID, titleChanged } = getTreeChanges({
      doc,
      parentFieldName,
      previousDoc,
      slugify,
      titleFieldName,
    })

    if (parentChanged || titleChanged) {
      const { newParentTree, parentDocument } = await fetchParentAndComputeTree({
        collection,
        doc,
        newParentID,
        parentChanged,
        prevParentID,
        req,
        slugPathFieldName,
        titlePathFieldName,
      })

      const treePaths = generateTreePaths({
        newDoc: doc,
        parentDocument,
        previousDocWithLocales,
        slugify,
        slugPathFieldName,
        titleFieldName,
        titlePathFieldName,
        ...(req.payload.config.localization && isTitleLocalized
          ? {
              localeCodes: req.payload.config.localization.localeCodes,
              localized: true,
              reqLocale: reqLocale || req.payload.config.localization.defaultLocale,
            }
          : {
              localized: false,
            }),
      })

      // NOTE: using the db directly, no hooks or access control here
      const documentAfterUpdate = await req.payload.db.updateOne({
        id: doc.id,
        collection: collection.slug,
        data: {
          _parentTree: newParentTree,
          [parentFieldName]: newParentID,
          [slugPathFieldName]: treePaths.slugPath,
          [titlePathFieldName]: treePaths.titlePath,
        },
        locale: 'all',
        req,
        select: {
          _parentTree: true,
          [slugPathFieldName]: true,
          [titlePathFieldName]: true,
        },
      })

      // Update all descendants in batches to handle unlimited tree sizes
      await updateDescendants({
        collection,
        documentAfterUpdate,
        fieldIsLocalized: isTitleLocalized,
        localeCodes:
          isTitleLocalized && req.payload.config.localization
            ? req.payload.config.localization.localeCodes
            : undefined,
        newParentID: newParentID ?? undefined,
        parentDocID: doc.id,
        parentFieldName,
        previousDocWithLocales,
        req,
        slugPathFieldName,
        titlePathFieldName,
      })

      const updatedSlugPath = isTitleLocalized
        ? documentAfterUpdate[slugPathFieldName][reqLocale!]
        : documentAfterUpdate[slugPathFieldName]
      const updatedTitlePath = isTitleLocalized
        ? documentAfterUpdate[titlePathFieldName][reqLocale!]
        : documentAfterUpdate[titlePathFieldName]
      const updatedParentTree = documentAfterUpdate._parentTree

      if (updatedSlugPath) {
        doc[slugPathFieldName] = updatedSlugPath
      }
      if (updatedTitlePath) {
        doc[titlePathFieldName] = updatedTitlePath
      }
      if (parentChanged) {
        doc._parentTree = updatedParentTree
      }

      return doc
    }
  }
