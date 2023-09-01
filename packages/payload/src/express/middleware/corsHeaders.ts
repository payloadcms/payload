import type { NextFunction, Request, Response } from 'express'

import type { SanitizedConfig } from '../../config/types'

export default (config: SanitizedConfig) => (req: Request, res: Response, next: NextFunction) => {
  if (config.cors) {
    res.header('Access-Control-Allow-Methods', 'PUT, PATCH, POST, GET, DELETE, OPTIONS')
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Encoding, x-apollo-tracing',
    )

    if (config.cors === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*')
    } else if (Array.isArray(config.cors) && config.cors.indexOf(req.headers.origin) > -1) {
      res.header('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    }
  }

  next()
}
