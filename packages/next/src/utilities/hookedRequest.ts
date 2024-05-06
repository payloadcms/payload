import type { PayloadRequestWithData } from 'payload/types'

export const hookedRequest = async ({ request }: { request: PayloadRequestWithData }) => {
  await request.payload.config.hooks.beforeEndpointPayloadRequestWithData.reduce(
    async (priorHook, hook) => {
      await priorHook

      request = await hook({
        req: request,
      })
    },
    Promise.resolve(),
  )

  return request
}
