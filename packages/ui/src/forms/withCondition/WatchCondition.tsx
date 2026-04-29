'use client'

import type React from 'react'

import { useOptionalVisibilityMap } from '../../providers/VisibilityMap/index.js'
import { useFormFields } from '../Form/context.js'

export const WatchCondition: React.FC<{
  children: React.ReactNode
  path: string
}> = (props) => {
  const { children, path } = props

  // Phase 8: prefer the client-computed visibility map when the path is
  // explicitly tracked there (path-valued admin.condition is resolved
  // and evaluated synchronously on every formState change). Fall back
  // to the server-driven `passesCondition` for inline conditions and
  // pre-Phase-3 fields that haven't migrated.
  const visibilityMap = useOptionalVisibilityMap()
  const clientVisibility = visibilityMap?.has(path) ? visibilityMap.get(path) : undefined

  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const passes = clientVisibility ?? field?.passesCondition

  if (passes === false) {
    return null
  }

  return children
}
