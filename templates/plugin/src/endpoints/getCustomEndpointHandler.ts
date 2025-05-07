import type { PayloadHandler } from 'payload'

export const getCustomEndpointHandler = (): PayloadHandler => {
  return () => {
    return Response.json({ message: 'Hello from custom endpoint' })
  }
}
