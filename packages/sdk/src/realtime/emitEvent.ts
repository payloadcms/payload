import type { PayloadSDK } from '../index.js'
import type { PayloadGeneratedTypes } from '../types.js'

export const emitEvent = async <T extends PayloadGeneratedTypes>(
  sdk: PayloadSDK<T>,
  args: {
    data: Record<string, any>
    event: string
  },
): Promise<Response> => {
  const response = await sdk.request({
    json: args,
    method: 'POST',
    path: '/realtime/emit',
  })

  return response
}
