import httpStatus from 'http-status'
import { accessOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const access: CollectionRouteHandler = async ({ req }) => {
  const results = await accessOperation({
    req,
  })

  return Response.json(results, {
    status: httpStatus.OK,
  })
}
