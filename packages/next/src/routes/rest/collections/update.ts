import type { Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import httpStatus from 'http-status'
import { updateOperation } from 'payload'
import { isNumber } from 'payload/shared'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeSelect } from '../utilities/sanitizeSelect.js'

export const update: CollectionRouteHandler = async ({ collection, req }) => {
  const { depth, draft, limit, overrideLock, select, where } = req.query as {
    depth?: string
    draft?: string
    limit?: string
    overrideLock?: string
    select?: Record<string, unknown>
    where?: Where
  }

  const result = await updateOperation({
    collection,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: draft === 'true',
    limit: isNumber(limit) ? Number(limit) : undefined,
    overrideLock: Boolean(overrideLock === 'true'),
    req,
    select: sanitizeSelect(select),
    where,
  })

  const headers = headersWithCors({
    headers: new Headers(),
    req,
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
        headers,
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
      headers,
      status: httpStatus.BAD_REQUEST,
    },
  )
}
