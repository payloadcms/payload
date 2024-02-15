import httpStatus from 'http-status'

import type { Where } from 'payload/types'

import { isNumber } from 'payload/utilities'
import { updateOperation } from 'payload/operations'
import { getTranslation } from '@payloadcms/translations'
import { CollectionRouteHandler } from '../types'
import qs from 'qs'

export const update: CollectionRouteHandler = async ({ req, collection }) => {
  const { searchParams } = req

  // parse using `qs` to handle `where` queries
  const { where, depth, draft } = qs.parse(searchParams.toString()) as {
    where?: Where
    depth?: string
    draft?: string
  }

  const result = await updateOperation({
    collection,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: draft === 'true',
    req,
    where,
  })

  if (result.errors.length === 0) {
    const message = req.t('general:updatedCountSuccessfully', {
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
  const message = req.t('error:unableToUpdateCount', {
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
