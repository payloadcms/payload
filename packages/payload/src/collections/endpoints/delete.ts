import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { deleteOperation } from '../operations/delete.js'

export const deleteHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const { depth, overrideLock, populate, select, trash, where } = parseParams(req.query)

  const result = await deleteOperation({
    collection,
    depth,
    overrideLock: overrideLock ?? false,
    populate,
    req,
    select,
    trash,
    where: where!,
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

  result.errors = result.errors.map((error) =>
    error.isPublic
      ? error
      : {
          ...error,
          message: 'Something went wrong.',
        },
  )

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
