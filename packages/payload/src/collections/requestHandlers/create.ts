import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'

import formatSuccessResponse from '../../express/responses/formatSuccess'
import { getTranslation } from '../../utilities/getTranslation'
import { isNumber } from '../../utilities/isNumber'
import create from '../operations/create'

export type CreateResult = {
  doc: Document
  message: string
}

export default async function createHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<CreateResult> | void> {
  try {
    const { searchParams } = new URL(req.url)
    const autosave = searchParams.get('autosave') === 'true'
    const draft = searchParams.get('draft') === 'true'
    const depth = searchParams.get('depth')

    const doc = await create({
      autosave,
      collection: req.collection,
      // TODO(JARROD): remove reliance on express body parsing
      data: req.body,
      depth: isNumber(depth) ? depth : undefined,
      draft,
      req,
    })

    res.status(httpStatus.CREATED).json({
      ...formatSuccessResponse(
        req.t('general:successfullyCreated', {
          label: getTranslation(req.collection.config.labels.singular, req.i18n),
        }),
        'message',
      ),
      doc,
    })
  } catch (error) {
    next(error)
  }
}
