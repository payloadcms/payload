import type { FormState } from '../Form/types'
import type { Field } from 'payload/types'
import { buildPathSegments } from './buildPathSegments'
import { mapFieldsAndReturnErrorCount } from './mapFieldsAndReturnErrorCount'

export const checkStateForErrors = ({
  formState,
  fieldSchema,
  path,
}: {
  formState: FormState
  fieldSchema: Field[]
  path: string
}): number => {
  const pathSegments = buildPathSegments(path, fieldSchema)
  const errorCount = mapFieldsAndReturnErrorCount({ formState, pathSegments })
  return errorCount
}
