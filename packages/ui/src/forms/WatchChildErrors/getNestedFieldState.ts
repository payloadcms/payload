import type { Field } from 'payload/types'

import type { FormState } from '../Form/types'

import { buildPathSegments } from './buildPathSegments'
import { getFieldStateFromPaths } from './getFieldStateFromPaths'

export const getNestedFieldState = ({
  fieldSchema,
  formState,
  path,
  pathSegments: pathSegmentsFromProps,
}: {
  fieldSchema?: Field[]
  formState?: FormState
  path: string
  pathSegments?: string[]
}): {
  errorCount: number
  fieldState: FormState
  pathSegments: string[]
} => {
  let pathSegments = pathSegmentsFromProps

  if (!pathSegments && fieldSchema) {
    pathSegments = buildPathSegments(path, fieldSchema)
  }

  const result = getFieldStateFromPaths({ formState, pathSegments })

  return {
    ...result,
    pathSegments,
  }
}
