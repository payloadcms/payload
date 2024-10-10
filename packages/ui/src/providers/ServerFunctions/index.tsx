import type { BuildFormStateArgs, ServerFunctionClient } from 'payload'

import React, { createContext, useCallback, useEffect, useRef } from 'react'

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

  // This is the local abort controller, to abort requests when the _provider_ itself unmounts, etc.
  // Each callback also accept a remote signal, to abort requests when each _component_ unmounts, etc.
  const abortControllerRef = useRef(new AbortController())

  const getFormState = useCallback<GetFormState>(
    async (args) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      const localSignal = abortController.signal

      const { signal: remoteSignal, ...rest } = args || {}

      try {
        if (!remoteSignal?.aborted && !localSignal?.aborted) {
          const result = (await serverFunction({
            name: 'form-state',
            args: rest,
          })) as ReturnType<typeof buildFormState> // TODO: infer this type when `strictNullChecks` is enabled

          if (!remoteSignal?.aborted && !localSignal?.aborted) {
            return result
          }
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }

      return { state: args.formState }
    },
    [serverFunction],
  )

  useEffect(() => {
    const controller = abortControllerRef.current

    return () => {
      if (controller) {
        try {
          // controller.abort()
        } catch (_err) {
          // swallow error
        }
      }
    }
  }, [])

  return (
    <ServerFunctionsContext.Provider value={{ getFormState, serverFunction }}>
      {children}
    </ServerFunctionsContext.Provider>
  )
}
