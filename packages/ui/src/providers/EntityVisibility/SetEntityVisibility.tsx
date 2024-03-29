'use client'
import type { VisibleEntities } from 'payload/types'
import type React from 'react';

import { useEffect } from 'react'

import { useEntityVisibility } from './index.js'

export const SetEntityVisibility: React.FC<{
  visibleEntities: VisibleEntities
}> = ({ visibleEntities }) => {
  const { setVisibleEntities } = useEntityVisibility()

  useEffect(() => {
    setVisibleEntities(visibleEntities)
  }, [visibleEntities, setVisibleEntities])

  return null
}
