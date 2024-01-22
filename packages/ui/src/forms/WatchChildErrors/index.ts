'use client'
import React from 'react'

import useThrottledEffect from '../../hooks/useThrottledEffect'
import { useAllFormFields, useFormSubmitted } from '../Form/context'
import { getFieldStateFromPaths } from './getFieldStateFromPaths'

type TrackSubSchemaErrorCountProps = {
  /**
   * Only for collapsibles, and unnamed-tabs
   */
  pathSegments?: string[]
  setErrorCount: (count: number) => void
}

export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({
  pathSegments,
  setErrorCount,
}) => {
  const [formState] = useAllFormFields()
  const hasSubmitted = useFormSubmitted()

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
