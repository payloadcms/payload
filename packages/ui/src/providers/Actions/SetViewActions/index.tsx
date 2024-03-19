'use client'
import type React from 'react'

import { useEffect } from 'react'

import type { ActionMap } from '../../ComponentMap/buildComponentMap/types.js'

import { useActions } from '../index.jsx'

export const SetViewActions: React.FC<{ actions: ActionMap['Edit'][string] }> = ({ actions }) => {
  const { setViewActions } = useActions()

  useEffect(() => {
    setViewActions(actions)

    return () => {
      setViewActions([])
    }
  }, [setViewActions, actions])

  return null
}
