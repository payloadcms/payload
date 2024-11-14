'use client'
import type { Field, FormState } from 'payload'

// import { buildPathSegments } from './buildPathSegments'
import { getFieldStateFromPaths } from './getFieldStateFromPaths.js'

export const getNestedFieldState = ({
  fieldSchema,
  formState,
  // path,
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
  const pathSegments = pathSegmentsFromProps

  if (!pathSegments && fieldSchema) {
    // pathSegments = buildPathSegments(path, fieldSchema)
  }

  const result = getFieldStateFromPaths({ formState, pathSegments })

  return {
    ...result,
    pathSegments,
  }
}
