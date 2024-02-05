'use client'
import React from 'react'

import useThrottledEffect from '../../hooks/useThrottledEffect'
import { useAllFormFields, useFormSubmitted } from '../Form/context'
import { getFieldStateFromPaths } from './getFieldStateFromPaths'
import { buildPathSegments } from './buildPathSegments'
import { FieldMap } from '../utilities/buildComponentMap/types'

type TrackSubSchemaErrorCountProps = {
  path: string
  fieldMap?: FieldMap
  setErrorCount: (count: number) => void
}

export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({
  path,
  fieldMap,
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
