'use client'

import React, { createContext, useContext, useState } from 'react'

type ActionsContextType = {
  Actions: {
    [key: string]: React.ReactNode
  }
  setViewActions: (actions: ActionsContextType['Actions']) => void
}

const ActionsContext = createContext<ActionsContextType>({
  Actions: {},
  setViewActions: () => {},
})

export const useActions = () => useContext(ActionsContext)

export const ActionsProvider: React.FC<{
  readonly Actions?: {
    [key: string]: React.ReactNode
  }
  readonly children: React.ReactNode
}> = ({ Actions, children }) => {
  const [viewActions, setViewActions] = useState(Actions)

  return (
    <ActionsContext.Provider
      value={{
        Actions: {
          ...viewActions,
          ...Actions,
        },
        setViewActions,
      }}
    >
      {children}
    </ActionsContext.Provider>
  )
}
