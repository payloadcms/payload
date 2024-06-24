import type { PayloadRequestWithData } from 'payload/types'

export type Context = {
  headers: {
    [key: string]: string
  }
  req: PayloadRequestWithData
}
