import type {
  CollectionSlug,
  ErrorResult,
  GetFolderResultsComponentAndDataArgs,
  ServerFunction,
  Where,
} from 'payload'
import type { FolderBreadcrumb, FolderOrDocument } from 'payload/shared'

import { APIError, formatErrors, getFolderData } from 'payload'
import { buildFolderWhereConstraints } from 'payload/shared'

import { FolderFileTable } from '../elements/FolderView/FolderFileTable/index.js'
import { ItemCardGrid } from '../elements/FolderView/ItemCardGrid/index.js'

type GetFolderResultsComponentAndDataResult = {
  breadcrumbs?: FolderBreadcrumb[]
  documents?: FolderOrDocument[]
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
    req.payload.logger.error({ err, msg: `There was an error building form state` })

    if (err.message === 'Could not find field schema for given path') {
      return {
        message: err.message,
      }
    }

    if (err.message === 'Unauthorized') {
      return null
    }

    return formatErrors(err)
  }
}

/**
 * This function is responsible for fetching folder data, building the results component
 * and returns the data and component together.
 *
 *
 * Open ended questions:
 * - If we rerender the results section, does the provider update?? I dont think so, if the provider is on the server.
 *   Maybe we should move the provider to the client.
 */
export const getFolderResultsComponentAndData = async ({
  activeCollectionSlugs,
  browseByFolder,
  displayAs,
  folderID = undefined,
  req,
  sort,
}: GetFolderResultsComponentAndDataArgs): Promise<GetFolderResultsComponentAndDataResult> => {
  const { payload } = req

  if (!payload.config.folders) {
    throw new APIError('Folders are not enabled in the configuration.')
  }

  let collectionSlug: CollectionSlug | undefined = undefined
  let documentWhere: undefined | Where = undefined
  let folderWhere: undefined | Where = undefined

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
    } else if ((browseByFolder && folderID) || !browseByFolder) {
      if (!browseByFolder) {
        collectionSlug = activeCollectionSlug
      }

      if (!documentWhere) {
        documentWhere = {
          or: [],
        }
      }

      const collectionConstraints = await buildFolderWhereConstraints({
        collectionConfig: payload.collections[activeCollectionSlug].config,
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
    documentWhere,
    folderID,
    folderWhere,
    req,
  })

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
          </>
        ) : null}
      </div>
    )
  } else {
    FolderResultsComponent = <FolderFileTable showRelationCell={browseByFolder} />
  }

  return {
    breadcrumbs: folderData.breadcrumbs,
    documents: folderData.documents,
    FolderResultsComponent,
    subfolders: folderData.subfolders,
  }
}
