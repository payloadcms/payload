import type { NextFunction, Request, Response } from 'express'

export default (req: Request, _: Response, next: NextFunction): void => {
  if (req.body?._payload) {
    const payloadJSON = JSON.parse(req.body._payload)

    req.body = {
      ...req.body,
      ...payloadJSON,
    }

    delete req.body?._payload
  }

  next()
}
