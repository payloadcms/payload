import httpStatus from 'http-status'

export const endpointsAreDisabled = ({
  endpoints,
  request,
}: {
  endpoints: false | unknown[]
  request: Partial<Request>
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
