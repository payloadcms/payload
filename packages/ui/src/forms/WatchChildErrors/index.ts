'use client'
import React from 'react'

import useThrottledEffect from '../../hooks/useThrottledEffect'
import { useAllFormFields, useFormSubmitted } from '../Form/context'
import { getFieldStateFromPaths } from './getFieldStateFromPaths'
import { buildPathSegments } from './buildPathSegments'
import { createFieldMap } from '../RenderFields/createFieldMap'

type TrackSubSchemaErrorCountProps = {
  path: string
  fieldMap?: ReturnType<typeof createFieldMap>
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
