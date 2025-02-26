import httpStatus from 'http-status'

import type { Endpoint } from '../../index.js'

import { isNumber } from '../../utilities/isNumber.js'
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
      docLimit: isNumber(req.searchParams.get('limit'))
        ? parseInt(String(req.searchParams.get('limit')), 10)
        : 10,
      folderID: req.searchParams.get('folderID'),
      page: isNumber(req.searchParams.get('page'))
        ? parseInt(String(req.searchParams.get('page')), 10)
        : 1,
      payload: req.payload,
      search:
        typeof req.searchParams.get('search') === 'string'
          ? req.searchParams.get('search')
          : undefined,
    })

    return Response.json(data)
  },
  method: 'get',
  path: '/populate-folder-data',
}
