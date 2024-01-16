'use client'
import React from 'react'

import type { Field } from 'payload/types'

import useThrottledEffect from '../../hooks/useThrottledEffect'
import { useAllFormFields, useFormSubmitted } from '../Form/context'
import { buildPathSegments } from './buildPathSegments'
import { getFieldStateFromPaths } from './getFieldStateFromPaths'

type TrackSubSchemaErrorCountProps = {
  /**
   * Only for collapsibles, and unnamed-tabs
   */
  fieldSchema?: Field[]
  path: string
  setErrorCount: (count: number) => void
}

export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({
  fieldSchema,
  path,
  setErrorCount,
}) => {
  const [formState] = useAllFormFields()
  const hasSubmitted = useFormSubmitted()
  const [pathSegments] = React.useState(() => {
    if (fieldSchema) {
      return buildPathSegments(path, fieldSchema)
    }

    return [`${path}.`]
  })

  useThrottledEffect(
    () => {
      if (hasSubmitted) {
        const { errorCount } = getFieldStateFromPaths({ formState, pathSegments })
        setErrorCount(errorCount)
      }
    },
    250,
    [formState, hasSubmitted, pathSegments],
  )

  return null
}
