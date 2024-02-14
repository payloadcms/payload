import httpStatus from 'http-status'

import { isNumber } from 'payload/utilities'
import { createOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const create: CollectionRouteHandler = async ({ req, collection }) => {
  const { searchParams } = req
  const autosave = searchParams.get('autosave') === 'true'
  const draft = searchParams.get('draft') === 'true'
  const depth = searchParams.get('depth')

  const doc = await createOperation({
    autosave,
    collection,
    data: req.data,
    depth: isNumber(depth) ? depth : undefined,
    draft,
    req,
  })

  return Response.json(
    {
      doc,
      message: req.t('general:successfullyCreated', {
        label: collection.config.labels.singular,
      }),
    },
    {
      status: httpStatus.CREATED,
    },
  )
}
