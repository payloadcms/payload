import type { PayloadRequest } from 'payload'

export type Context = {
  headers: {
    [key: string]: string
  }
  req: PayloadRequest
}
