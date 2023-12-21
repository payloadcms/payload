import httpStatus from 'http-status'

import type { PayloadRequest } from 'payload/types'

import { isNumber } from 'payload/utilities'
import { createOperation } from 'payload/operations'

// TODO(JARROD): pattern to catch errors and return correct Response
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

  // ...formatSuccessResponse(
  //   req.t('general:successfullyCreated', {
  //     label: getTranslation(req.collection.config.labels.singular, req.i18n),
  //   }),
  //   'message',
  // )
  return Response.json(doc, {
    status: httpStatus.OK,
  })
}
