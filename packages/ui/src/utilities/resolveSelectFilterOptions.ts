import type { Data, Option, PayloadRequest, SelectField } from 'payload'

export const resolveSelectFilterOptions = async ({
  data,
  field,
  req,
  siblingData,
}: {
  data: Data
  field: SelectField
  req: PayloadRequest
  siblingData: Data
}): Promise<Option[] | undefined> => {
  if (typeof field.filterOptions !== 'function') {
    return undefined
  }

  return field.filterOptions({
    data,
    options: field.options,
    req,
    siblingData,
  })
}
