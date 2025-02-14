import httpStatus from 'http-status'

import type { Endpoint } from '../../index.js'

import { foldersSlug } from '../constants.js'
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

    const folderCollection = Boolean(req.payload.collections?.[foldersSlug])

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
      folderID: req.searchParams.get('folderID'),
      payload: req.payload,
    })

    return Response.json(data)
  },
  method: 'get',
  path: '/populate-folder-data',
}
