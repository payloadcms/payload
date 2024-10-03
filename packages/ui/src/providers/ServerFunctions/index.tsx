import type { BuildFormStateArgs, ServerFunctionClient } from 'payload'

import React, { createContext, useCallback } from 'react'

import type { buildFormState } from '../../utilities/buildFormState.js'

type GetFormState = (
  args: {
    signal?: AbortSignal
  } & Omit<BuildFormStateArgs, 'req'>,
) => ReturnType<typeof buildFormState>

type ServerFunctionsContextType = {
  getFormState: GetFormState
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

  const getFormState = useCallback<GetFormState>(
    async (args) => {
      try {
        const result = (await serverFunction({
          name: 'form-state',
          args,
        })) as ReturnType<typeof buildFormState> // TODO: infer this type when `strictNullChecks` is enabled

        if (args.signal?.aborted) {
          return { state: args.formState }
        }

        return result
      } catch (error) {
        console.error(error) // eslint-disable-line no-console
        return { state: args.formState }
      }
    },
    [serverFunction],
  )

  return (
    <ServerFunctionsContext.Provider value={{ getFormState, serverFunction }}>
      {children}
    </ServerFunctionsContext.Provider>
  )
}
