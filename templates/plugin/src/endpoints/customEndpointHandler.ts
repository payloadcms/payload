import type { PayloadHandler } from 'payload'

export const customEndpointHandler = (): PayloadHandler => {
  return () => {
    return Response.json({ message: 'Hello from custom endpoint' })
  }
}
