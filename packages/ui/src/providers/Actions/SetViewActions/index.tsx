'use client'
import type { MappedComponent } from 'payload'
import type React from 'react'

import { useEffect } from 'react'

import { useActions } from '../index.js'

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
