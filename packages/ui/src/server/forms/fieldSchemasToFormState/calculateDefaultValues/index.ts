import type {
  Data,
  Field as FieldSchema,
  PayloadRequest,
  SelectMode,
  SelectType,
  User,
} from 'payload'

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
  user: User
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
