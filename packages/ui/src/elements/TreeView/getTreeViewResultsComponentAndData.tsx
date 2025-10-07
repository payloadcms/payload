import type {
  Document,
  ErrorResult,
  GetTreeViewResultsComponentAndDataArgs,
  ServerFunction,
} from 'payload'

import { APIError, formatErrors, getTreeViewData } from 'payload'

import {
  TreeViewTable,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- This component is returned via server functions, it must reference the exports dir
} from '../../exports/client/index.js'

type GetTreeViewResultsComponentAndDataResult = {
  documents?: Document[]
  TreeViewResultsComponent: React.ReactNode
}

type GetTreeViewResultsComponentAndDataErrorResult = {
  documents?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export const getTreeViewResultsComponentAndDataHandler: ServerFunction<
  GetTreeViewResultsComponentAndDataArgs,
  Promise<GetTreeViewResultsComponentAndDataErrorResult | GetTreeViewResultsComponentAndDataResult>
> = async (args) => {
  const { req } = args

  try {
    const res = await getTreeViewResultsComponentAndData(args)
    return res
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `There was an error getting the tree view results component and data`,
    })

    return formatErrors(err)
  }
}

/**
 * This function is responsible for fetching folder data, building the results component
 * and returns the data and component together.
 */
export const getTreeViewResultsComponentAndData = async ({
  collectionSlug,
  req,
  // search,
  expandedItemIDs,
  sort,
}: GetTreeViewResultsComponentAndDataArgs): Promise<GetTreeViewResultsComponentAndDataResult> => {
  const { payload } = req

  if (!payload.config.treeView) {
    throw new APIError('Tree view is not enabled in the configuration.')
  }

  const treeViewData = await getTreeViewData({
    collectionSlug,
    expandedItemIDs,
    fullTitleFieldName: 'name',
    parentFieldName: '_parentDoc',
    req,
    sort,
  })

  const TreeViewResultsComponent = <TreeViewTable />

  return {
    documents: treeViewData.documents,
    TreeViewResultsComponent,
  }
}
