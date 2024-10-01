import type { ClientServerFunction } from 'payload'

import React, { createContext } from 'react'

type ServerFunctionsContextType = {
  serverFunction: ClientServerFunction
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
  serverFunction: ClientServerFunction
}> = ({ children, serverFunction }) => {
  return (
    <ServerFunctionsContext.Provider value={{ serverFunction }}>
      {children}
    </ServerFunctionsContext.Provider>
  )
}
