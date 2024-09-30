import type { PayloadServerAction } from 'payload'

import React, { createContext } from 'react'

type ServerActionsContextType = {
  payloadServerAction: PayloadServerAction
}

export const ServerActionsContext = createContext<ServerActionsContextType | undefined>(undefined)

export const useServerActions = () => {
  const context = React.useContext(ServerActionsContext)
  if (context === undefined) {
    throw new Error('useServerActions must be used within a ServerActionsProvider')
  }
  return context
}

export const ServerActionsProvider: React.FC<{
  children: React.ReactNode
  payloadServerAction: PayloadServerAction
}> = ({ children, payloadServerAction }) => {
  return (
    <ServerActionsContext.Provider value={{ payloadServerAction }}>
      {children}
    </ServerActionsContext.Provider>
  )
}
