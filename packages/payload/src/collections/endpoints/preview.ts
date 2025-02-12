// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { extractJWT } from '../../auth/extractJWT.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { findByIDOperation } from '../operations/findByID.js'

export const previewHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const doc = await findByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    req,
  })

  let previewURL: string

  const generatePreviewURL =
    req.payload?.collections?.[collection.config.slug]?.config?.admin?.preview

  const token = extractJWT(req)

  if (typeof generatePreviewURL === 'function') {
    previewURL = await generatePreviewURL(doc, {
      locale: req.locale,
      req,
      token,
    })
  }

  return Response.json(previewURL, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
