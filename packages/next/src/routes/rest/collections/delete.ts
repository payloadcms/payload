import type { Where } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import httpStatus from 'http-status'
import { deleteOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import qs from 'qs'

import type { CollectionRouteHandler } from '../types.d.ts'

export const deleteDoc: CollectionRouteHandler = async ({ collection, req }) => {
  const { search } = req

  // parse using `qs` to handle `where` queries
  const { depth, where } = qs.parse(search, {
    ignoreQueryPrefix: true,
    strictNullHandling: true,
  }) as {
    depth?: string
    where?: Where
  }

  const result = await deleteOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
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
