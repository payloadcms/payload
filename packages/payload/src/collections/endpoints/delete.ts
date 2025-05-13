// @ts-strict-ignore
import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { deleteOperation } from '../operations/delete.js'

export const deleteHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { depth, overrideLock, populate, select, where } = req.query as {
    depth?: string
    overrideLock?: string
    populate?: Record<string, unknown>
    select?: Record<string, unknown>
    where?: Where
  }

  const result = await deleteOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    overrideLock: Boolean(overrideLock === 'true'),
    populate: sanitizePopulateParam(populate),
    req,
    select: sanitizeSelectParam(select),
    where,
  })

  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  if (result.errors.length === 0) {
    const message = req.t('general:deletedCountSuccessfully', {
      count: result.docs.length,
      label: getTranslation(
        collection.config.labels[result.docs.length === 1 ? 'singular' : 'plural'],
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

  const message = req.t('error:unableToDeleteCount', {
    count: result.errors.length,
    label: getTranslation(collection.config.labels[total === 1 ? 'singular' : 'plural'], req.i18n),
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
