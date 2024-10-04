import type { RenderFieldBySchemaPathClient, ServerFunctionClient } from 'payload'

import React, { createContext, useCallback } from 'react'

type ServerFunctionsContextType = {
  renderFieldBySchemaPath: RenderFieldBySchemaPathClient
  serverFunction: ServerFunctionClient
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
  serverFunction: ServerFunctionClient
}> = ({ children, serverFunction }) => {
  if (!serverFunction) {
    throw new Error('ServerFunctionsProvider requires a serverFunction prop')
  }

  const renderFieldBySchemaPath = useCallback<RenderFieldBySchemaPathClient>(
    async (args) => {
      const { schemaPath } = args

      return (await serverFunction({
        name: 'render-field',
        args: {
          schemaPath,
        },
      })) as React.ReactNode[]
    },
    [serverFunction],
  )

  return (
    <ServerFunctionsContext.Provider value={{ renderFieldBySchemaPath, serverFunction }}>
      {children}
    </ServerFunctionsContext.Provider>
  )
}
