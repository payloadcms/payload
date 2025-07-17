import type {
  CollectionSlug,
  ErrorResult,
  GetFolderResultsComponentAndDataArgs,
  ServerFunction,
  Where,
} from 'payload'
import type { FolderBreadcrumb, FolderOrDocument } from 'payload/shared'

import { APIError, formatErrors, getFolderData } from 'payload'
import { buildFolderWhereConstraints, combineWhereConstraints } from 'payload/shared'

import {
  FolderDocumentsPagination,
  FolderFileTable,
  ItemCardGrid,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- This component is returned via server functions, it must reference the exports dir
} from '../exports/client/index.js'

type GetFolderResultsComponentAndDataResult = {
  breadcrumbs?: FolderBreadcrumb[]
  documents?: FolderOrDocument[]
  folderAssignedCollections?: CollectionSlug[]
  FolderResultsComponent: React.ReactNode
  subfolders?: FolderOrDocument[]
}

type GetFolderResultsComponentAndDataErrorResult = {
  breadcrumbs?: never
  documents?: never
  FolderResultsComponent?: never
  subfolders?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export const getFolderResultsComponentAndDataHandler: ServerFunction<
  GetFolderResultsComponentAndDataArgs,
  Promise<GetFolderResultsComponentAndDataErrorResult | GetFolderResultsComponentAndDataResult>
> = async (args) => {
  const { req } = args

  try {
    const res = await getFolderResultsComponentAndData(args)
    return res
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `There was an error getting the folder results component and data`,
    })

    return formatErrors(err)
  }
}

/**
 * This function is responsible for fetching folder data, building the results component
 * and returns the data and component together.
 */
export const getFolderResultsComponentAndData = async ({
  browseByFolder = false,
  collectionsToDisplay: activeCollectionSlugs,
  displayAs,
  docLimit = 10,
  docPage = 1,
  folderAssignedCollections,
  folderID = undefined,
  folderLimit = 0,
  folderPage = 1,
  req,
  sort,
}: GetFolderResultsComponentAndDataArgs): Promise<GetFolderResultsComponentAndDataResult> => {
  const { payload } = req

  if (!payload.config.folders) {
    throw new APIError('Folders are not enabled in the configuration.')
  }

  const emptyQuery = {
    id: {
      exists: false,
    },
  }

  let collectionSlug: CollectionSlug | undefined = undefined
  let documentWhere: undefined | Where =
    Array.isArray(activeCollectionSlugs) && !activeCollectionSlugs.length ? emptyQuery : undefined
  let folderWhere: undefined | Where =
    Array.isArray(activeCollectionSlugs) && !activeCollectionSlugs.length ? emptyQuery : undefined

  const limits = new Set<number>()

  // todo(perf): - collect promises and resolve them in parallel
  for (const activeCollectionSlug of activeCollectionSlugs) {
    if (activeCollectionSlug === payload.config.folders.slug) {
      const folderCollectionConstraints = await buildFolderWhereConstraints({
        collectionConfig: payload.collections[activeCollectionSlug].config,
        folderID,
        localeCode: req?.locale,
        req,
        search: typeof req?.query?.search === 'string' ? req.query.search : undefined,
        sort,
      })

      if (folderCollectionConstraints) {
        folderWhere = folderCollectionConstraints
      }

      folderWhere = combineWhereConstraints([
        folderWhere,
        Array.isArray(folderAssignedCollections) &&
        folderAssignedCollections.length &&
        payload.config.folders.collectionSpecific
          ? {
              or: [
                {
                  folderType: {
                    in: folderAssignedCollections,
                  },
                },
                // if the folderType is not set, it means it accepts all collections and should appear in the results
                {
                  folderType: {
                    exists: false,
                  },
                },
                {
                  folderType: {
                    equals: [],
                  },
                },
                {
                  folderType: {
                    equals: null,
                  },
                },
              ],
            }
          : undefined,
      ])
    } else if ((browseByFolder && folderID) || !browseByFolder) {
      if (!browseByFolder) {
        collectionSlug = activeCollectionSlug
      }

      if (!documentWhere) {
        documentWhere = {
          or: [],
        }
      }

      const collectionConfig = payload.collections[activeCollectionSlug].config
      if (Array.isArray(collectionConfig.admin.pagination.limits)) {
        collectionConfig.admin.pagination.limits.forEach((limit) => limits.add(limit))
      }

      const collectionConstraints = await buildFolderWhereConstraints({
        collectionConfig,
        folderID,
        localeCode: req?.locale,
        req,
        search: typeof req?.query?.search === 'string' ? req.query.search : undefined,
        sort,
      })

      if (collectionConstraints) {
        documentWhere.or.push(collectionConstraints)
      }
    }
  }

  const folderData = await getFolderData({
    collectionSlug,
    docLimit,
    docPage,
    documentWhere,
    folderID,
    folderLimit,
    folderPage,
    folderWhere,
    req,
    sort,
  })
  const { breadcrumbs, documents, documentsPagination, subfolders } = folderData

  let FolderResultsComponent = null

  if (displayAs === 'grid') {
    FolderResultsComponent = (
      <div>
        {folderData.subfolders.length ? (
          <>
            <ItemCardGrid items={folderData.subfolders} title={'Folders'} type="folder" />
          </>
        ) : null}

        {folderData.documents.length ? (
          <>
            <ItemCardGrid
              items={folderData.documents}
              subfolderCount={folderData.subfolders.length}
              title={'Documents'}
              type="file"
            />

            <FolderDocumentsPagination {...documentsPagination} limits={[...limits]} />
          </>
        ) : null}
      </div>
    )
  } else {
    FolderResultsComponent = (
      <>
        <FolderFileTable showRelationCell={browseByFolder} />
        <FolderDocumentsPagination {...documentsPagination} limits={[...limits]} />
      </>
    )
  }

  return {
    breadcrumbs,
    documents,
    folderAssignedCollections: folderData.folderAssignedCollections,
    FolderResultsComponent,
    subfolders,
  }
}
