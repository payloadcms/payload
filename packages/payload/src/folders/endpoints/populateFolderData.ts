import httpStatus from 'http-status'

import type { Endpoint } from '../../index.js'

import { getFolderData } from '../utils/getFolderData.js'

export const populateFolderDataEndpoint: Endpoint = {
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

    const folderCollection = Boolean(req.payload.collections?.[req.payload.config.folders.slug])

    if (!folderCollection) {
      return Response.json(
        {
          message: 'Folders are not configured',
        },
        {
          status: httpStatus.NOT_FOUND,
        },
      )
    }

    const data = await getFolderData({
      collectionSlug: req.searchParams?.get('collectionSlug') || undefined,
      folderID: req.searchParams?.get('folderID') || undefined,
      payload: req.payload,
      search: req.searchParams?.get('search') || undefined,
      user: req.user,
    })

    return Response.json(data)
  },
  method: 'get',
  path: '/populate-folder-data',
}
