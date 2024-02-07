import { PayloadRequest } from 'payload/types'

export type Context = {
  req: PayloadRequest
  headers: Headers
}
