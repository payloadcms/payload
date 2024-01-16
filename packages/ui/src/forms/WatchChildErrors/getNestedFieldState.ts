import type { FormState } from '../Form/types'
import type { Field } from 'payload/types'
import { buildPathSegments } from './buildPathSegments'
import { getFieldStateFromPaths } from './getFieldStateFromPaths'

export const getNestedFieldState = ({
  formState,
  fieldSchema,
  path,
  pathSegments: pathSegmentsFromProps,
}: {
  formState?: FormState
  fieldSchema?: Field[]
  path: string
  pathSegments?: string[]
}): {
  errorCount: number
  fieldState: FormState
} => {
  let pathSegments = pathSegmentsFromProps

  if (!pathSegments && path && fieldSchema) {
    pathSegments = buildPathSegments(path, fieldSchema)
  }

  const result = getFieldStateFromPaths({ formState, pathSegments })

  return result
}
