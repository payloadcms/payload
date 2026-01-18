import type {
  Data,
  Field as FieldSchema,
  PayloadRequest,
  SelectMode,
  SelectType,
  TypedUser,
} from '@ruya.sa/payload'

import { iterateFields } from './iterateFields.js'

type Args = {
  data: Data
  fields: FieldSchema[]
  id?: number | string
  locale: string | undefined
  req: PayloadRequest
  select?: SelectType
  selectMode?: SelectMode
  siblingData: Data
  user: TypedUser
}

export const calculateDefaultValues = async ({
  id,
  data,
  fields,
  locale,
  req,
  select,
  selectMode,
  user,
}: Args): Promise<Data> => {
  await iterateFields({
    id,
    data,
    fields,
    locale,
    req,
    select,
    selectMode,
    siblingData: data,
    user,
  })

  return data
}
