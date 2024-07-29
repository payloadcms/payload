'use client'
import type { FieldMap } from 'payload'
import type React from 'react'

import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAllFormFields, useFormSubmitted } from '../Form/context.js'
import { buildPathSegments } from './buildPathSegments.js'
import { getFieldStateFromPaths } from './getFieldStateFromPaths.js'

type TrackSubSchemaErrorCountProps = {
  fieldMap?: FieldMap
  path: string
  setErrorCount: (count: number) => void
}

export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({
  fieldMap,
  path,
  setErrorCount,
}) => {
  const [formState] = useAllFormFields()
  const hasSubmitted = useFormSubmitted()

  const pathSegments = buildPathSegments(path, fieldMap)

  useThrottledEffect(
    () => {
      if (hasSubmitted) {
        const { errorCount } = getFieldStateFromPaths({ formState, pathSegments })
        setErrorCount(errorCount)
      }
    },
    250,
    [formState, hasSubmitted, fieldMap],
  )

  return null
}
