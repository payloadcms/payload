import type React from 'react'

import { useEffect } from 'react'

import type { ActionMap } from '../../../utilities/buildComponentMap/types'

import { useActions } from '..'

export const SetViewActions: React.FC<{ actions: ActionMap[string] }> = ({ actions }) => {
  const { setViewActions } = useActions()

  useEffect(() => {
    setViewActions(actions)

    return () => {
      setViewActions([])
    }
  }, [setViewActions, actions])

  return null
}
