import type { NextFunction, Request, Response } from 'express'

import type { Collection } from './config/types'

const bindCollectionMiddleware =
  (collection: Collection) =>
  (req: Request & { collection: Collection }, res: Response, next: NextFunction): void => {
    req.collection = collection
    next()
  }

export default bindCollectionMiddleware
