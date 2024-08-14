'use client'
import type { ClientField } from 'packages/payload/src/index.js'
import type React from 'react'

import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAllFormFields, useFormSubmitted } from '../Form/context.js'
import { buildPathSegments } from './buildPathSegments.js'
import { getFieldStateFromPaths } from './getFieldStateFromPaths.js'

type TrackSubSchemaErrorCountProps = {
  fields?: ClientField[]
  path: string
  setErrorCount: (count: number) => void
}

export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({
  fields,
  path,
  setErrorCount,
}) => {
  const [formState] = useAllFormFields()
  const hasSubmitted = useFormSubmitted()

  const pathSegments = buildPathSegments(path, fields)

  useThrottledEffect(
    () => {
      if (hasSubmitted) {
        const { errorCount } = getFieldStateFromPaths({ formState, pathSegments })
        setErrorCount(errorCount)
      }
    },
    250,
    [formState, hasSubmitted, fields],
  )

  return null
}
