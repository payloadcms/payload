import type { ServerFunction } from 'payload'

import React, { createContext } from 'react'

type ServerFunctionsContextType = {
  payloadServerFunction: ServerFunction
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
  serverFunction: ServerFunction
}> = ({ children, serverFunction }) => {
  return (
    <ServerFunctionsContext.Provider value={{ payloadServerFunction: serverFunction }}>
      {children}
    </ServerFunctionsContext.Provider>
  )
}
