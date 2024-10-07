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
      const { signal, ...rest } = args

      try {
        if (!signal.aborted) {
          const result = (await serverFunction({
            name: 'form-state',
            args: rest,
          })) as ReturnType<typeof buildFormState> // TODO: infer this type when `strictNullChecks` is enabled

          if (signal?.aborted) {
            throw new Error('Request was aborted, ignoring result')
          }

          return result
        }
      } catch (error) {
        console.error(error) // eslint-disable-line no-console
      }

      return { state: args.formState }
    },
    [serverFunction],
  )

  return (
    <ServerFunctionsContext.Provider value={{ getFormState, serverFunction }}>
      {children}
    </ServerFunctionsContext.Provider>
  )
}
