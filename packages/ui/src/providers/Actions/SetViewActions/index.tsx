'use client'
import React, { useEffect } from 'react'

import { useActions } from '../index.js'
import type { MappedComponent } from 'payload'

export const SetViewActions: React.FC<{ actions: MappedComponent[] }> = ({ actions }) => {
  const { setViewActions } = useActions()

  useEffect(() => {
    setViewActions(actions)

    return () => {
      setViewActions([])
    }
  }, [setViewActions, actions])

  return null
}
