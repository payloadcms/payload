import type { Data, Field as FieldSchema, PayloadRequest, User } from 'payload'

import { iterateFields } from './iterateFields.js'

type Args = {
  data: Data
  fields: FieldSchema[]
  id?: number | string
  locale: string | undefined
  req: PayloadRequest
  siblingData: Data
  user: User
}

export const calculateDefaultValues = async ({
  id,
  data,
  fields,
  locale,
  req,
  user,
}: Args): Promise<Data> => {
  await iterateFields({
    id,
    data,
    fields,
    locale,
    req,
    siblingData: data,
    user,
  })

  return data
}
