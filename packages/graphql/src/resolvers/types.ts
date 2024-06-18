import type { PayloadRequestWithData } from 'payload'

export type Context = {
  headers: {
    [key: string]: string
  }
  req: PayloadRequestWithData
}
