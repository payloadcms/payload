import type { CollectionSlug, Document, PaginatedDocs, PayloadRequest, Where } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type JoinFieldDocs<T> = {
  count: number
  docs: (number | string | T)[]
  hasNextPage: boolean
}

type GetItemsResult = {
  docs: FolderOrDocument[]
  folderAssignedCollections: CollectionSlug[] | undefined
  pagination: Omit<PaginatedDocs, 'docs'>
}

type Args = {
  collectionSlug?: CollectionSlug
  folderFieldName: string
  foldersSlug: CollectionSlug
  /**
   * The amount of documents to return
   * @default 10
   */
  limit: number
  /**
   * The `page` parameter used for pagination
   * @default 1
   */
  page: number
  /**
   * The ID of the parent folder to query documents from.
   * If not specified, will query documents not in a folder.
   * @default undefined
   */
  parentFolderID?: number | string
  req: PayloadRequest
  sort?: string
  /**
   * Optional where clause to filter documents by
   * @default undefined
   */
  where: Where
}

// if !parentFolderID && !collectionSlug - view is browseByFolder and should not return documents
// if parentFolderID && !collectionSlug - view is browseByFolder and should return documents using join field
// if !parentFolderID && collectionSlug - view is collectionFolders and should return documents
// if parentFolderID && collectionSlug - view is collectionFolders and should return documents using find

function hasNoResults(limit: number): GetItemsResult {
  return {
    docs: [],
    folderAssignedCollections: undefined,
    pagination: {
      hasNextPage: false,
      hasPrevPage: false,
      limit,
      nextPage: null,
      page: 1,
      pagingCounter: 0,
      prevPage: null,
      totalDocs: 0,
      totalPages: 0,
    },
  }
}

/**
 * Get documents and pagination for a specific folder or documents without a parent folder.
 */
export async function getDocsAndPagination({
  collectionSlug,
  folderFieldName,
  foldersSlug,
  limit,
  page,
  parentFolderID,
  req,
  sort,
  where,
}: Args): Promise<GetItemsResult> {
  const { payload, user } = req

  if (parentFolderID) {
    /**
     * Get documents in a specific folder.
     *
     * Use the join field to get documents in the folder and format them as FolderOrDocument items.
     */
    const safeLimit = limit > 0 ? limit : 10
    const folderResult = await payload.findByID({
      id: parentFolderID,
      collection: foldersSlug,
      joins: {
        documentsAndFolders: {
          count: true,
          limit: safeLimit,
          page,
          sort,
          where,
        },
      },
      overrideAccess: false,
      req,
      user,
    })

    const joinResult: JoinFieldDocs<any> = folderResult.documentsAndFolders || {
      docs: [],
    }

    const docsInFolder: FolderOrDocument[] = (joinResult?.docs || []).map(
      ({ relationTo, value }: Document) => {
        return formatFolderOrDocumentItem({
          folderFieldName,
          isUpload: Boolean(payload.collections[relationTo]!.config.upload),
          relationTo,
          useAsTitle: payload.collections[relationTo]!.config.admin?.useAsTitle,
          value,
        })
      },
    )

    const totalDocs = joinResult.count
    const hasNextPage = joinResult.hasNextPage
    const hasPrevPage = page > 1

    return {
      docs: docsInFolder,
      folderAssignedCollections: folderResult.folderType || [],
      pagination: {
        hasNextPage,
        hasPrevPage,
        limit: safeLimit,
        nextPage: hasNextPage ? page + 1 : null,
        page,
        pagingCounter: (page - 1) * safeLimit + 1,
        prevPage: hasPrevPage ? page - 1 : null,
        totalDocs,
        totalPages: safeLimit > 0 ? Math.ceil(totalDocs / safeLimit) : 1,
      },
    }
  } else if (collectionSlug) {
    /**
     * Get documents NOT in a folder.
     *
     * Use the find results and format them as FolderOrDocument items.
     */
    const docsNotInFolder = (await payload.find({
      collection: collectionSlug,
      limit,
      overrideAccess: false,
      page,
      req,
      sort: payload.collections[collectionSlug]?.config.admin.useAsTitle,
      user,
      where: combineWhereConstraints([
        where,
        {
          or: [
            {
              [folderFieldName]: {
                exists: false,
              },
            },
            {
              [folderFieldName]: {
                equals: null,
              },
            },
          ],
        },
      ]),
    })) as PaginatedDocs<Document>

    if (!docsNotInFolder || !docsNotInFolder.docs) {
      return hasNoResults(limit)
    }

    const { docs, ...pagination } = docsNotInFolder

    return {
      docs: docs.map((doc) =>
        formatFolderOrDocumentItem({
          folderFieldName,
          isUpload: Boolean(payload.collections[collectionSlug]?.config.upload),
          relationTo: collectionSlug,
          useAsTitle: payload.collections[collectionSlug]?.config.admin.useAsTitle,
          value: doc,
        }),
      ),
      folderAssignedCollections: [collectionSlug],
      pagination,
    }
  } else {
    /**
     * No parentFolderID and no collectionSlug
     * The ROOT `browseByFolder` and should not return documents (only folders).
     */
    return hasNoResults(limit)
  }
}
