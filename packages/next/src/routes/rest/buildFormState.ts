import type { PayloadRequest } from 'payload'

import { buildFormStateFn } from '@payloadcms/ui/utilities/buildFormState'
import httpStatus from 'http-status'

import { headersWithCors } from '../../utilities/headersWithCors.js'
import { routeError } from './routeError.js'

export const buildFormState = async ({ req }: { req: PayloadRequest }) => {
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  try {
    const body = await req.json()
    const result = await buildFormStateFn({ req, ...body })

    return Response.json(result, {
      headers,
      status: httpStatus.OK,
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: `There was an error building form state` })

    if (err.message === 'Could not find field schema for given path') {
      return Response.json(
        {
          message: err.message,
        },
        {
          headers,
          status: httpStatus.BAD_REQUEST,
        },
      )
    }

    if (err.message === 'Unauthorized') {
      return Response.json(null, {
        headers,
        status: httpStatus.UNAUTHORIZED,
      })
    }

    return routeError({
      config: req.payload.config,
      err,
      req,
    })
  }
}
