import type { RequestHandler } from 'express'
import type { IParseOptions } from 'qs'

import { parse as parseQueryString } from 'qs'
import { parse as parseUrl } from 'url'

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type QueryStringOptions = IParseOptions & { decoder?: never | undefined }

export function addParsedQuery(options?: QueryStringOptions): RequestHandler {
  return (req, res, next) => {
    const url = parseUrl(req.url)
    req.query = parseQueryString(url.query, options)
    next()
  }
}
