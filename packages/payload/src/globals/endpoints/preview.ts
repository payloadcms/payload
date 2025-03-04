// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { extractJWT } from '../../auth/extractJWT.js'
import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { findOneOperation } from '../operations/findOne.js'

export const previewHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const doc = await findOneOperation({
    slug: globalConfig.slug,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    globalConfig,
    req,
  })

  let previewURL: string

  const generatePreviewURL = req.payload.config.globals.find(
    (config) => config.slug === globalConfig.slug,
  )?.admin?.preview

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
