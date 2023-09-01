import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../types'

import { setRequestContext } from '../setRequestContext'

function defaultPayload(req: PayloadRequest, res: Response, next: NextFunction) {
  setRequestContext(req)
  next()
}

export default defaultPayload
