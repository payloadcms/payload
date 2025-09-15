import type {
  CollectionAfterChangeHook,
  Document,
  FieldAffectingData,
  JsonObject,
  TypeWithID,
} from '../../index.js'
import type { AddTreeViewFieldsArgs } from '../types.js'
import type { GenerateTreePathsArgs } from '../utils/generateTreePaths.js'

import { adjustAffectedTreePaths } from '../utils/adjustAffectedTreePaths.js'
import { generateTreePaths } from '../utils/generateTreePaths.js'
import { getTreeChanges } from '../utils/getTreeChanges.js'

type Ags = {
  titleField: FieldAffectingData
} & Required<Omit<AddTreeViewFieldsArgs, 'collectionConfig'>>
export const collectionTreeViewAfterChange =
  ({
    parentDocFieldName,
    slugify,
    slugPathFieldName,
    titleField,
    titlePathFieldName,
  }: Ags): CollectionAfterChangeHook =>
  async ({ collection, doc, previousDoc, previousDocWithLocales, req }) => {
    const fieldIsLocalized = Boolean(titleField.localized)
    const titleFieldName: string = titleField.name!
    const reqLocale = req.locale

    // handle this better later
    if (reqLocale === 'all') {
      return
    }
    const { newParentID, parentChanged, prevParentID, slugChanged } = getTreeChanges({
      doc,
      parentDocFieldName,
      previousDoc,
      slugify,
      titleFieldName,
    })

    let parentDocument: Document = undefined

    if (parentChanged || slugChanged) {
      let newParentTree: (number | string)[] = []

      const baseGenerateTreePathsArgs: Omit<
        GenerateTreePathsArgs,
        'defaultLocale' | 'localeCodes' | 'localized' | 'parentDocument' | 'reqLocale'
      > = {
        newDoc: doc,
        previousDocWithLocales,
        slugify,
        slugPathFieldName,
        titleFieldName,
        titlePathFieldName,
      }

      if (parentChanged && newParentID) {
        // set new parent
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

        newParentTree = [...(parentDocument?._parentTree || []), newParentID]
      } else if (parentChanged && !newParentID) {
        newParentTree = []
      } else {
        // only the title updated
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

        newParentTree = doc._parentTree
      }

      const treePaths = generateTreePaths({
        ...baseGenerateTreePathsArgs,
        parentDocument,
        ...(fieldIsLocalized && req.payload.config.localization
          ? {
              defaultLocale: req.payload.config.localization.defaultLocale,
              localeCodes: req.payload.config.localization.localeCodes,
              localized: true,
              reqLocale: reqLocale as string,
            }
          : {
              localized: false,
            }),
      })
      const newSlugPath = treePaths.slugPath
      const newTitlePath = treePaths.titlePath

      const documentAfterUpdate = await req.payload.db.updateOne({
        id: doc.id,
        collection: collection.slug,
        data: {
          _parentTree: newParentTree,
          [slugPathFieldName]: newSlugPath,
          [titlePathFieldName]: newTitlePath,
        },
        locale: 'all',
        req,
        select: {
          _parentTree: true,
          [slugPathFieldName]: true,
          [titlePathFieldName]: true,
        },
      })

      const affectedDocs = await req.payload.find({
        collection: collection.slug,
        depth: 0,
        limit: 200,
        locale: 'all',
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
      affectedDocs.docs.forEach((affectedDoc) => {
        const newTreePaths = adjustAffectedTreePaths({
          affectedDoc,
          newDoc: documentAfterUpdate,
          previousDocWithLocales,
          slugPathFieldName,
          titlePathFieldName,
          ...(req.payload.config.localization && fieldIsLocalized
            ? {
                localeCodes: req.payload.config.localization.localeCodes,
                localized: true,
              }
            : {
                localized: false,
              }),
        })

        // Find the index of doc.id in affectedDoc's parent tree
        const docIndex = affectedDoc._parentTree?.indexOf(doc.id) ?? -1
        const descendants = docIndex >= 0 ? affectedDoc._parentTree.slice(docIndex) : []

        updatePromises.push(
          // this pattern has an issue bc it will not run hooks on the affected documents
          // if we use payload.update, then we will need to loop over `n` locales and run 1 update per locale
          req.payload.db.updateOne({
            id: affectedDoc.id,
            collection: collection.slug,
            data: {
              _parentTree: [...(doc._parentTree || []), ...descendants],
              [slugPathFieldName]: newTreePaths.slugPath,
              [titlePathFieldName]: newTreePaths.titlePath,
            },
            locale: 'all',
            req,
          }),
        )
      })

      await Promise.all(updatePromises)

      const updatedSlugPath = fieldIsLocalized
        ? documentAfterUpdate[slugPathFieldName][reqLocale!]
        : documentAfterUpdate[slugPathFieldName]
      const updatedTitlePath = fieldIsLocalized
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
