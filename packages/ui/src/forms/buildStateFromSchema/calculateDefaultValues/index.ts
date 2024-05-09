import type { Data, Field as FieldSchema, PayloadRequestWithData } from 'payload/types'

import { iterateFields } from './iterateFields.js'

type Args = {
  data: Data
  fields: FieldSchema[]
  id?: number | string
  req: PayloadRequestWithData
  siblingData: Data
}

export const calculateDefaultValues = async ({ id, data, fields, req }: Args): Promise<Data> => {
  await iterateFields({
    id,
    data,
    fields,
    req,
    siblingData: data,
  })

  return data
}
