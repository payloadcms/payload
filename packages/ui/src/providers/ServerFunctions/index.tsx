import type { BuildFormStateArgs, BuildTableStateArgs, Data, ServerFunctionClient } from 'payload'

import React, { createContext, useCallback, useEffect, useRef } from 'react'

import type { buildFormStateHandler } from '../../utilities/buildFormState.js'
import type { buildTableState } from '../../utilities/buildTableState.js'

type GetFormStateClient = (
  args: {
    signal?: AbortSignal
  } & Omit<BuildFormStateArgs, 'clientConfig' | 'req'>,
) => ReturnType<typeof buildFormStateHandler>

type GetTableStateClient = (
  args: {
    signal?: AbortSignal
  } & Omit<BuildTableStateArgs, 'clientConfig' | 'req'>,
) => ReturnType<typeof buildTableState>

type GetDrawerDocumentView = (args: {
  collectionSlug: string
  disableActions?: boolean
  docID?: number | string
  drawerSlug?: string
  initialData?: Data
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  signal?: AbortSignal
}) => Promise<{ docID: string; Document: React.ReactNode }>

type ServerFunctionsContextType = {
  getDrawerDocument: GetDrawerDocumentView
  getFormState: GetFormStateClient
  getTableState: GetTableStateClient
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

  const getFormState = useCallback<GetFormStateClient>(
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
          })) as ReturnType<typeof buildFormStateHandler> // TODO: infer this type when `strictNullChecks` is enabled

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

  const getTableState = useCallback<GetTableStateClient>(
    async (args) => {
      const { ...rest } = args || {}

      try {
        const result = (await serverFunction({
          name: 'table-state',
          args: rest,
        })) as ReturnType<typeof buildTableState> // TODO: infer this type when `strictNullChecks` is enabled

        return result
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }

      // return { state: args.formState }
    },
    [serverFunction],
  )

  const getDrawerDocument = useCallback<GetDrawerDocumentView>(
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
            name: 'render-document',
            args: rest,
          })) as { docID: string; Document: React.ReactNode }

          if (!remoteSignal?.aborted && !localSignal?.aborted) {
            return result
          }
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
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
    <ServerFunctionsContext.Provider
      value={{ getDrawerDocument, getFormState, getTableState, serverFunction }}
    >
      {children}
    </ServerFunctionsContext.Provider>
  )
}
