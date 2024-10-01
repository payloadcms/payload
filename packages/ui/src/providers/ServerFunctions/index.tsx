import type { ClientServerFunction } from 'payload'

import React, { createContext } from 'react'

type ServerFunctionsContextType = {
  serverFunctions: ClientServerFunction
}

export const ServerFunctionsContext = createContext<ServerFunctionsContextType | undefined>(
  undefined,
)

export const useServerFunctions = () => {
  const context = React.useContext(ServerFunctionsContext)
  if (context === undefined) {
    throw new Error('useServerFunctions must be used within a ServerFunctionsProvider')
  }
  return context
}

export const ServerFunctionsProvider: React.FC<{
  children: React.ReactNode
  serverFunctions: ClientServerFunction
}> = ({ children, serverFunctions }) => {
  return (
    <ServerFunctionsContext.Provider value={{ serverFunctions }}>
      {children}
    </ServerFunctionsContext.Provider>
  )
}
