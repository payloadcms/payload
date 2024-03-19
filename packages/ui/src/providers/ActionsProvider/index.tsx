'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

import type { ActionMap } from '../../utilities/buildComponentMap/types.js'

import { useComponentMap } from '../ComponentMapProvider/index.js'

export { SetViewActions } from './SetViewActions/index.jsx'

type ActionsContextType = {
  actions: ActionMap['Edit'][string]
  setViewActions: (actions: ActionMap['Edit'][string]) => void
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
    componentMap: { actions },
  } = useComponentMap()

  useEffect(() => {
    setAdminActions(actions || [])
  }, [actions])

  const combinedActions = [...(viewActions || []), ...(adminActions || [])]

  return (
    <ActionsContext.Provider value={{ actions: combinedActions, setViewActions }}>
      {children}
    </ActionsContext.Provider>
  )
}
