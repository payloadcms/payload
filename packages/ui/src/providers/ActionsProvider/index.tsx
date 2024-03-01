'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

import type { ActionMap } from '../../utilities/buildComponentMap/types'

import { useConfig } from '../Config'

type ActionsContextType = {
  actions: ActionMap[string]
  setViewActions: (actions: ActionMap[string]) => void
}

const ActionsContext = createContext<ActionsContextType>({
  actions: [],
  setViewActions: () => {},
})

export const useActions = () => useContext(ActionsContext)

export const ActionsProvider = ({ children }) => {
  const [viewActions, setViewActions] = useState([])
  const [adminActions, setAdminActions] = useState([])

  const {
    admin: {
      components: { actions: configAdminActions },
    },
  } = useConfig()

  useEffect(() => {
    setAdminActions(configAdminActions || [])
  }, [configAdminActions])

  const combinedActions = [...(viewActions || []), ...(adminActions || [])]

  return (
    <ActionsContext.Provider value={{ actions: combinedActions, setViewActions }}>
      {children}
    </ActionsContext.Provider>
  )
}
