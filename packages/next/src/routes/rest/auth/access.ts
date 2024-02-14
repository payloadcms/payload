import httpStatus from 'http-status'
import { accessOperation } from 'payload/operations'
import { BaseRouteHandler } from '../types'

export const access: BaseRouteHandler = async ({ req }) => {
  const results = await accessOperation({
    req,
  })

  return Response.json(results, {
    status: httpStatus.OK,
  })
}
