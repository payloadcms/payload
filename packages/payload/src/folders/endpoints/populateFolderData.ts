import httpStatus from 'http-status'
import * as qs from 'qs-esm'

import type { Endpoint, Where } from '../../index.js'

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
      folderID: req.searchParams.get('folderID'),
      // search:
      //   typeof req.searchParams.get('search') === 'string'
      //     ? req.searchParams.get('search')
      //     : undefined,
      collectionSlugs: req.searchParams.getAll('collectionSlugs'),
      docSort: req.searchParams.get('docSort'),
      docWhere: req.searchParams.get('where')
        ? (qs.parse(req.searchParams.get('where')) as Where)
        : undefined,
      locale: req.locale,
      payload: req.payload,
      user: req.user,
    })

    return Response.json(data)
  },
  method: 'get',
  path: '/populate-folder-data',
}
