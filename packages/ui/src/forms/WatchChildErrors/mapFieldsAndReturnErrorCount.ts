import type { FormState } from '../Form/types'

export const mapFieldsAndReturnErrorCount = ({
  formState,
  pathSegments,
}: {
  formState: FormState
  pathSegments: string[]
}): number => {
  let errorCount = 0

  Object.entries(formState).forEach(([key]) => {
    const matchingSegment = pathSegments.some((segment) => {
      if (segment.endsWith('.')) {
        return key.startsWith(segment)
      }
      return key === segment
    })

    if (matchingSegment) {
      const fieldState = formState[key]
      if ('valid' in fieldState && !fieldState.valid) {
        errorCount += 1
      }
    }
  })

  return errorCount
}
