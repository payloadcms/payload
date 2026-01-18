import type { PayloadRequest, SelectType } from '@ruya.sa/payload'

export type Context = {
  headers: {
    [key: string]: string
  }
  req: PayloadRequest
  select: SelectType
}
