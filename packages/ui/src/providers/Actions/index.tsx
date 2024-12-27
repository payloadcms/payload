'use client'

import React, { createContext, useContext, useState } from 'react'

type ActionsContextType = {
  Actions: {
    [key: string]: React.ReactNode
  }
  SaveActions: {
    [key: string]: React.ReactNode
  }
  setSaveActions: (actions: ActionsContextType['SaveActions']) => void
  setViewActions: (actions: ActionsContextType['Actions']) => void
}

const ActionsContext = createContext<ActionsContextType>({
  Actions: {},
  SaveActions: {},
  setSaveActions: () => {},
  setViewActions: () => {},
})

export const useActions = () => useContext(ActionsContext)

export const ActionsProvider: React.FC<{
  readonly Actions?: {
    [key: string]: React.ReactNode
  }
  readonly children: React.ReactNode
  readonly SaveActions?: {
    [key: string]: React.ReactNode
  }
}> = ({ Actions, children, SaveActions }) => {
  const [viewActions, setViewActions] = useState(Actions)
  const [saveActions, setSaveActions] = useState(SaveActions)

  return (
    <ActionsContext.Provider
      value={{
        Actions: {
          ...viewActions,
          ...Actions,
        },
        SaveActions: {
          ...saveActions,
        },
        setSaveActions,
        setViewActions,
      }}
    >
      {children}
    </ActionsContext.Provider>
  )
}
