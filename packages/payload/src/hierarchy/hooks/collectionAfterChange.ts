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

    const { newParentID, parentChanged, titleChanged } = getTreeChanges({
      doc,
      parentFieldName,
      previousDoc,
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

      if (newParentDoc._h_parentTree && newParentDoc._h_parentTree.includes(doc.id)) {
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
        const previousTitle = previousDoc[titleFieldName]
        const previousSlug = slugify(previousTitle)

        if (previousDoc[parentFieldName]) {
          // Document has a parent - fetch parent's path and combine with document's old title
          const previousParentDoc = await req.payload.findByID({
            id: previousDoc[parentFieldName],
            collection: collection.slug,
            depth: 0,
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
            previousDocWithPaths = {
              ...previousDocWithLocales,
              [slugPathFieldName]: previousSlug,
              [titlePathFieldName]: previousTitle,
            }
          }
        }
      }

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

      // Skip updating hierarchy fields for draft-only title changes
      // Draft hierarchy fields are managed in the versions collection and updated when published
      // We only update for: creates, parent changes, or published documents
      const shouldSkipHierarchyUpdate =
        operation === 'update' && doc._status === 'draft' && !parentChanged && titleChanged

      let updatedDocWithLocales = docWithLocales

      if (!shouldSkipHierarchyUpdate) {
        // NOTE: using the db directly, no hooks or access control here
        updatedDocWithLocales = await req.payload.db.updateOne({
          id: doc.id,
          collection: collection.slug,
          data: updateData,
          locale: 'all',
          req,
          select: selectFields,
        })
      } else {
        // For draft-only title changes, we need to update the draft version in the versions table
        // with the new hierarchy fields so descendants can use this data
        updatedDocWithLocales = {
          ...docWithLocales,
          ...updateData,
        }

        // Update the draft version in the versions table if drafts are enabled
        if (hasDraftsEnabled(collection)) {
          // Query for the latest draft version
          const { docs: draftVersions } = await req.payload.db.findVersions({
            collection: collection.slug,
            limit: 1,
            pagination: false,
            req,
            sort: '-updatedAt',
            where: {
              parent: {
                equals: doc.id,
              },
              'version._status': {
                equals: 'draft',
              },
            },
          })

          const [latestDraftVersion] = draftVersions

          if (latestDraftVersion) {
            // Update the draft version with new hierarchy fields
            await req.payload.db.updateVersion({
              id: latestDraftVersion.id,
              collection: collection.slug,
              req,
              versionData: {
                autosave: latestDraftVersion.autosave,
                createdAt: latestDraftVersion.createdAt,
                latest: latestDraftVersion.latest,
                parent: latestDraftVersion.parent,
                publishedLocale: latestDraftVersion.publishedLocale,
                updatedAt: new Date().toISOString(),
                version: {
                  ...latestDraftVersion.version,
                  ...updateData,
                },
              },
            })
          }
        }
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

      // Update doc with new values
      if (generatePaths) {
        // Ensure we have a valid locale for accessing localized fields
        const safeLocale =
          reqLocale ||
          (req.payload.config.localization ? req.payload.config.localization.defaultLocale : 'en')

        const updatedSlugPath = isTitleLocalized
          ? updatedDocWithLocales[slugPathFieldName][safeLocale]
          : updatedDocWithLocales[slugPathFieldName]
        const updatedTitlePath = isTitleLocalized
          ? updatedDocWithLocales[titlePathFieldName][safeLocale]
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

        // Ensure parent field is set to ID, not populated object
        if (parentChanged) {
          doc[parentFieldName] = newParentID
        }
      }

      return doc
    }
  }
