import type { PayloadRequest, SelectType } from 'payload'

export type Context = {
  headers: {
    [key: string]: string
  }
  req: PayloadRequest
  select: SelectType
}
