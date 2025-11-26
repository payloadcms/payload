import type {
  CollectionAfterChangeHook,
  Document,
  FieldAffectingData,
  JsonObject,
  TypeWithID,
} from '../../index.js'

import { adjustDescendantTreePaths } from '../utils/adjustDescendantTreePaths.js'
import { generateTreePaths } from '../utils/generateTreePaths.js'
import { getTreeChanges } from '../utils/getTreeChanges.js'

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

    let parentDocument: Document = undefined

    if (parentChanged || titleChanged) {
      let newParentTree: (number | string)[] = []

      if (parentChanged && newParentID) {
        // Moving document to new parent
        parentDocument = await req.payload.findByID({
          id: newParentID,
          collection: collection.slug,
          depth: 0,
          locale: 'all',
          select: {
            _parentTree: true,
            [slugPathFieldName]: true,
            [titlePathFieldName]: true,
          },
        })

        // Combine parent's _parentTree with newParentID to form new parent tree
        newParentTree = [...(parentDocument?._parentTree || []), newParentID]
      } else if (parentChanged && !newParentID) {
        // Moved document to the root (no parent)
        newParentTree = []
      } else {
        // Document did not move, but the title changed
        if (prevParentID) {
          parentDocument = await req.payload.findByID({
            id: prevParentID,
            collection: collection.slug,
            depth: 0,
            locale: 'all',
            req,
            select: {
              _parentTree: true,
              [slugPathFieldName]: true,
              [titlePathFieldName]: true,
            },
          })
        }

        // keep existing parent tree
        newParentTree = doc._parentTree
      }

      const treePaths = generateTreePaths({
        newDoc: doc,
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

      // Process descendants in batches to handle unlimited tree sizes
      let currentPage = 1
      let hasNextPage = true
      const batchSize = 100

      while (hasNextPage) {
        const descendantDocsQuery = await req.payload.find({
          collection: collection.slug,
          depth: 0,
          limit: batchSize,
          locale: 'all',
          page: currentPage,
          req,
          select: {
            _parentTree: true,
            [slugPathFieldName]: true,
            [titlePathFieldName]: true,
          },
          where: {
            _parentTree: {
              in: [doc.id],
            },
          },
        })

        const updatePromises: Promise<JsonObject & TypeWithID>[] = []
        descendantDocsQuery.docs.forEach((affectedDoc) => {
          const newTreePaths = adjustDescendantTreePaths({
            affectedDoc,
            fieldIsLocalized: isTitleLocalized,
            localeCodes:
              isTitleLocalized && req.payload.config.localization
                ? req.payload.config.localization.localeCodes
                : undefined,
            newDoc: documentAfterUpdate,
            previousDocWithLocales,
            slugPathFieldName,
            titlePathFieldName,
          })

          // Find the index of doc.id in affectedDoc's parent tree
          const docIndex = affectedDoc._parentTree?.indexOf(doc.id) ?? -1
          const descendants = docIndex >= 0 ? affectedDoc._parentTree.slice(docIndex) : []

          updatePromises.push(
            // this pattern has an issue bc it will not run hooks on the affected documents
            // NOTE: using the db directly, no hooks or access control here
            // Using payload.update, we will need to loop over `n` locales and run 1 update per locale and `n` versions will be created
            req.payload.db.updateOne({
              id: affectedDoc.id,
              collection: collection.slug,
              data: {
                _parentTree: [...(doc._parentTree || []), ...descendants],
                [parentFieldName]: newParentID,
                [slugPathFieldName]: newTreePaths.slugPath,
                [titlePathFieldName]: newTreePaths.titlePath,
              },
              locale: 'all',
              req,
            }),
          )
        })

        await Promise.all(updatePromises)

        hasNextPage = descendantDocsQuery.hasNextPage
        currentPage++
      }

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
