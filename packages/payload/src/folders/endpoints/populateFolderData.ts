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

    if (
      !(
        req.payload.config.folders &&
        Boolean(req.payload.collections?.[req.payload.config.folders.slug])
      )
    ) {
      return Response.json(
        {
          message: 'Folders are not configured',
        },
        {
          status: httpStatus.NOT_FOUND,
        },
      )
    }

    // if collectionSlug exists, we need to create constraints for that _specific collection_ and the folder collection
    // if collectionSlug does not exist, we need to create constraints for _all folder enabled collections_ and the folder collection
    let documentWhere: undefined | Where
    let folderWhere: undefined | Where
    const collectionSlug = req.searchParams?.get('collectionSlug')

    if (collectionSlug) {
      const collectionConfig = req.payload.collections?.[collectionSlug]?.config

      if (!collectionConfig) {
        return Response.json(
          {
            message: `Collection with slug "${collectionSlug}" not found`,
          },
          {
            status: httpStatus.NOT_FOUND,
          },
        )
      }

      const collectionConstraints = await buildFolderWhereConstraints({
        collectionConfig,
        folderID: req.searchParams?.get('folderID') || undefined,
        localeCode: typeof req?.locale === 'string' ? req.locale : undefined,
        req,
        search: req.searchParams?.get('search') || undefined,
        sort: req.searchParams?.get('sort') || undefined,
      })

      if (collectionConstraints) {
        documentWhere = collectionConstraints
      }
    } else {
      // loop over all folder enabled collections and build constraints for each
      for (const collectionSlug of Object.keys(req.payload.collections)) {
        const collectionConfig = req.payload.collections[collectionSlug]?.config

        if (collectionConfig?.folders) {
          const collectionConstraints = await buildFolderWhereConstraints({
            collectionConfig,
            folderID: req.searchParams?.get('folderID') || undefined,
            localeCode: typeof req?.locale === 'string' ? req.locale : undefined,
            req,
            search: req.searchParams?.get('search') || undefined,
          })

          if (collectionConstraints) {
            if (!documentWhere) {
              documentWhere = { or: [] }
            }
            if (!Array.isArray(documentWhere.or)) {
              documentWhere.or = [documentWhere]
            } else if (Array.isArray(documentWhere.or)) {
              documentWhere.or.push(collectionConstraints)
            }
          }
        }
      }
    }

    const folderCollectionConfig =
      req.payload.collections?.[req.payload.config.folders.slug]?.config

    if (!folderCollectionConfig) {
      return Response.json(
        {
          message: 'Folder collection not found',
        },
        {
          status: httpStatus.NOT_FOUND,
        },
      )
    }

    const folderConstraints = await buildFolderWhereConstraints({
      collectionConfig: folderCollectionConfig,
      folderID: req.searchParams?.get('folderID') || undefined,
      localeCode: typeof req?.locale === 'string' ? req.locale : undefined,
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
