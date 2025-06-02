import httpStatus from 'http-status'

import type { Endpoint, Where } from '../../index.js'

import { buildFolderWhereConstraints } from '../utils/buildFolderWhereConstraints.js'
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

    // if collectionSlug exists, we need to creat constraints for that collection and the folder collection
    // if collectionSlug does not exist, e need to create constraints for all folder enabled collections and the folder collection

    let documentWhere: undefined | Where
    let folderWhere: undefined | Where
    const collectionSlug = req.searchParams?.get('collectionSlug')

    if (collectionSlug) {
      const collectionConfig = req.payload.collections?.[collectionSlug]?.config

      const collectionConstraints = await buildFolderWhereConstraints({
        collectionConfig,
        folderID: req.searchParams?.get('folderID') || undefined,
        localeCode: req?.locale,
        req,
        search: req.searchParams?.get('search') || undefined,
      })

      if (collectionConstraints) {
        documentWhere = collectionConstraints
      }
    } else {
      if (!documentWhere) {
        documentWhere = {
          or: [],
        }
      }
      // loop over all folder enabled collections and build constraints for each
      for (const collectionSlug of Object.keys(req.payload.collections)) {
        const collectionConfig = req.payload.collections[collectionSlug].config

        if (collectionConfig?.folders) {
          const collectionConstraints = await buildFolderWhereConstraints({
            collectionConfig,
            folderID: req.searchParams?.get('folderID') || undefined,
            localeCode: req?.locale,
            req,
            search: req.searchParams?.get('search') || undefined,
          })

          if (collectionConstraints) {
            documentWhere.or.push(collectionConstraints)
          }
        }
      }
    }

    const folderConstraints = await buildFolderWhereConstraints({
      collectionConfig: req.payload.collections[req.payload.config.folders.slug].config,
      folderID: req.searchParams?.get('folderID') || undefined,
      localeCode: req?.locale,
      req,
      search: req.searchParams?.get('search') || undefined,
    })

    if (folderConstraints) {
      folderWhere = folderConstraints
    }

    const data = await getFolderData({
      collectionSlug: req.searchParams?.get('collectionSlug') || undefined,
      documentWhere: documentWhere ? documentWhere : undefined,
      folderID: req.searchParams?.get('folderID') || undefined,
      folderWhere,
      req,
    })

    return Response.json(data)
  },
  method: 'get',
  path: '/populate-folder-data',
}
