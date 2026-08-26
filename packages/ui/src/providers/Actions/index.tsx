'use client'

import React, { createContext, use, useEffect, useState } from 'react'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'

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

export const useActions = () => use(ActionsContext)

/** @internal */
export const ActionsProvider: React.FC<{
  readonly Actions?: {
    [key: string]: React.ReactNode
  }
  readonly children: React.ReactNode
  readonly viewKey?: string
}> = ({ Actions, children, viewKey }) => {
  const [viewActions, setViewActions] = useState(Actions)
  const resetViewActions = useEffectEvent(() => {
    setViewActions(Actions)
  })

  useEffect(() => {
    resetViewActions()
  }, [viewKey])

  return (
    <ActionsContext
      value={{
        Actions: {
          ...viewActions,
          ...Actions,
        },
        setViewActions,
      }}
    >
      {children}
    </ActionsContext>
  )
}
