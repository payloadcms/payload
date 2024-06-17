import type { PayloadRequestWithData } from 'payload'

import { buildFormState as buildFormStateFn } from '@payloadcms/ui/utilities/buildFormState'
import httpStatus from 'http-status'

import { headersWithCors } from '../../utilities/headersWithCors.js'
import { routeError } from './routeError.js'

export const buildFormState = async ({ req }: { req: PayloadRequestWithData }) => {
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  try {
    const result = await buildFormStateFn({ req })

    return Response.json(result, {
      headers,
      status: httpStatus.OK,
    })
  } catch (err) {
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

    req.payload.logger.error({ err, msg: `There was an error building form state` })

    return routeError({
      config: req.payload.config,
      err,
      req,
    })
  }
}
