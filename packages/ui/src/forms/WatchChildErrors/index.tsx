'use client'
import type { ClientField } from 'payload'
import type React from 'react'

import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAllFormFields, useFormSubmitted } from '../Form/context.js'
import { buildPathSegments } from './buildPathSegments.js'

type TrackSubSchemaErrorCountProps = {
  fields?: ClientField[]
  /**
   * This path should only include path segments that affect data
   * i.e. it should not include _index-0 type segments
   *
   * For collapsibles and tabs you can simply pass their parent path
   */
  path: (number | string)[]
  setErrorCount: (count: number) => void
}
export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({
  fields,
  path: parentPath,
  setErrorCount,
}) => {
  const [formState] = useAllFormFields()
  const hasSubmitted = useFormSubmitted()

  const segmentsToMatch = buildPathSegments(fields)

  useThrottledEffect(
    () => {
      if (hasSubmitted) {
        let errorCount = 0
        Object.entries(formState).forEach(([key]) => {
          const matchingSegment = segmentsToMatch?.some((segment) => {
            const segmentToMatch = [...parentPath, segment].join('.')
            // match fields with same parent path
            if (segmentToMatch.endsWith('.')) {
              return key.startsWith(segmentToMatch)
            }
            // match fields with same path
            return key === segmentToMatch
          })

          if (matchingSegment) {
            const pathState = formState[key]
            if ('valid' in pathState && !pathState.valid) {
              errorCount += 1
            }
          }
        })
        setErrorCount(errorCount)
      }
    },
    250,
    [formState, hasSubmitted, fields],
  )

  return null
}
