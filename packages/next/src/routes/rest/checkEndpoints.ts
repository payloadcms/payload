import httpStatus from 'http-status'
import { CollectionConfig, GlobalConfig } from 'payload/types'

export const endpointsAreDisabled = ({
  request,
  endpoints,
}: {
  request: Partial<Request>
  endpoints: unknown[] | false
}) => {
  if (!endpoints) {
    return Response.json(
      {
        message: `Cannot ${request.method.toUpperCase()} ${request.url}`,
      },
      {
        status: httpStatus.NOT_IMPLEMENTED,
      },
    )
  }
}
