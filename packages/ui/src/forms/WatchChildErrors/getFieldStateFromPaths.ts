'use client'
import type { FormState } from 'payload'

export const getFieldStateFromPaths = ({
  formState,
  pathSegments,
}: {
  formState: FormState
  pathSegments: string[]
}): {
  errorCount: number
  fieldState: FormState
} => {
  const fieldState: FormState = {}
  let errorCount = 0

  Object.entries(formState).forEach(([key]) => {
    const matchingSegment = pathSegments?.some((segment) => {
      if (segment.endsWith('.')) {
        return key.startsWith(segment)
      }
      return key === segment
    })

    if (matchingSegment) {
      const pathState = formState[key]
      fieldState[key] = pathState
      if ('valid' in pathState && !pathState.valid) {
        errorCount += 1
      }
    }
  })

  return {
    errorCount,
    fieldState,
  }
}
