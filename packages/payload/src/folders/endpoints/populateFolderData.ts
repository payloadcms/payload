import httpStatus from 'http-status'

import type { CollectionSlug, Endpoint } from '../../index.js'
import type { FolderEnabledColection } from '../types.js'

import { populateFolderAndData } from '../utils/populateFolderAndData.js'

type PopulateBreadcrumbsArgs = {
  mediaSlug: CollectionSlug
}
export const populateFolderDataEndpoint = ({ mediaSlug }: PopulateBreadcrumbsArgs): Endpoint => ({
  handler: async (req) => {
    if (!req?.user) {
      return Response.json(
        {
          message: 'Unauthorized request.',
        },
        {
          status: httpStatus.UNAUTHORIZED,
        },
      )
    }

    const folderEnabledCollectionConfig: FolderEnabledColection | undefined = req.payload
      .collections?.[mediaSlug].config as FolderEnabledColection

    if (!folderEnabledCollectionConfig) {
      return Response.json(
        {
          message: 'Folder collection not found.',
        },
        {
          status: httpStatus.NOT_FOUND,
        },
      )
    }

    const folderData = await populateFolderAndData({
      collectionConfig: folderEnabledCollectionConfig,
      folderID: req.searchParams.get('folderID'),
      i18n: req.i18n,
      payload: req.payload,
      user: req.user,
      // thread through where query
    })

    return Response.json(folderData)
  },
  method: 'get',
  path: '/populate-folder-data',
})
