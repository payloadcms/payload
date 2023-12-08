import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'

import formatSuccessResponse from '../../express/responses/formatSuccess'
import { isNumber } from '../../utilities/isNumber'
import restoreVersion from '../operations/restoreVersion'

export type RestoreResult = {
  doc: Document
  message: string
}

export default async function restoreVersionHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<RestoreResult> | void> {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const options = {
    id: req.params.id,
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    payload: req.payload,
    req,
  }

  try {
    const doc = await restoreVersion(options)
    res.status(httpStatus.OK).json({
      ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
      doc,
    })
  } catch (error) {
    next(error)
  }
}
