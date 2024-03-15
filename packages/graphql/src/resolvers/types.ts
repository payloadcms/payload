import type { PayloadRequest } from 'payload/types'

export type Context = {
  headers: {
    [key: string]: string
  }
  req: PayloadRequest
}
