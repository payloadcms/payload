'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { useConfig } from '@payloadcms/ui'
import { MappedComponent } from 'packages/payload/src/index.js'

export { SetViewActions } from './SetViewActions/index.js'

type ActionsContextType = {
  actions: MappedComponent[]
  setViewActions: (actions: MappedComponent[]) => void
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
    config: {
      admin: {
        components: { actions },
      },
    },
  } = useConfig()

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
