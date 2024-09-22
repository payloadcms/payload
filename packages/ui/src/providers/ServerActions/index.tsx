import type { PayloadServerAction } from 'payload'

import React from 'react'

const ServerActionsContext = React.createContext<null | PayloadServerAction>(null)

export const ServerActions: React.FC<{
  readonly children: React.ReactNode
  readonly payloadServerAction: PayloadServerAction
}> = ({ children, payloadServerAction }) => {
  return (
    <ServerActionsContext.Provider value={payloadServerAction}>
      {children}
    </ServerActionsContext.Provider>
  )
}

export const useServerActions = (): PayloadServerAction => {
  const context = React.useContext(ServerActionsContext)

  if (context === null) {
    throw new Error('useServerActions must be used within a ServerActionsProvider')
  }

  return context
}
