import httpStatus from 'http-status'

import type { Where } from 'payload/types'
import { getTranslation } from '@payloadcms/translations'
import { deleteOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'
import qs from 'qs'

export const deleteDoc: CollectionRouteHandler = async ({ req, collection }) => {
  const { searchParams } = req

  // parse using `qs` to handle `where` queries
  const { where, depth } = qs.parse(searchParams.toString()) as {
    where?: Where
    depth?: string
  }

  const result = await deleteOperation({
    collection,
    depth: depth ? Number(depth) : undefined,
    req,
    where,
  })

  if (result.errors.length === 0) {
    const message = req.t('general:deletedCountSuccessfully', {
      count: result.docs.length,
      label: getTranslation(
        collection.config.labels[result.docs.length > 1 ? 'plural' : 'singular'],
        req.i18n,
      ),
    })

    return Response.json(
      {
        ...result,
        message,
      },
      {
        status: httpStatus.OK,
      },
    )
  }

  const total = result.docs.length + result.errors.length

  const message = req.t('error:unableToDeleteCount', {
    count: result.errors.length,
    label: getTranslation(collection.config.labels[total > 1 ? 'plural' : 'singular'], req.i18n),
    total,
  })

  return Response.json(
    {
      ...result,
      message,
    },
    {
      status: httpStatus.BAD_REQUEST,
    },
  )
}
