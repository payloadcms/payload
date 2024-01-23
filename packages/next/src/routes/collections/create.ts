import httpStatus from 'http-status'

import type { PayloadRequest } from 'payload/types'

import { isNumber } from 'payload/utilities'
import { createOperation } from 'payload/operations'

export const create = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const autosave = searchParams.get('autosave') === 'true'
  const draft = searchParams.get('draft') === 'true'
  const depth = searchParams.get('depth')

  const doc = await createOperation({
    autosave,
    collection: req.collection,
    data: req.data,
    depth: isNumber(depth) ? depth : undefined,
    draft,
    req,
  })

  return Response.json(
    {
      doc,
      message: req.t('general:successfullyCreated', {
        label: req.collection.config.labels.singular,
      }),
    },
    {
      status: httpStatus.CREATED,
    },
  )
}
