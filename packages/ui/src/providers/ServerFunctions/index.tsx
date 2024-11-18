import type { ServerFunctionClient } from 'payload'

import React, { createContext, useCallback } from 'react'

import type { buildFormStateHandler } from '../../utilities/buildFormState.js'
import type { buildTableStateHandler } from '../../utilities/buildTableState.js'
import type {
  GetDocumentSlots,
  GetFormStateClient,
  GetTableStateClient,
  RenderDocument,
} from './types.js'

type ServerFunctionsContextType = {
  getDocumentSlots: GetDocumentSlots
  getFormState: GetFormStateClient
  getTableState: GetTableStateClient
  renderDocument: RenderDocument
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

  const getDocumentSlots = useCallback<GetDocumentSlots>(
    async (args) =>
      await serverFunction({
        name: 'render-document-slots',
        args,
      }),
    [serverFunction],
  )

  const getFormState = useCallback<GetFormStateClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args || {}

      try {
        if (!remoteSignal?.aborted) {
          const result = (await serverFunction({
            name: 'form-state',
            args: { fallbackLocale: false, ...rest },
          })) as ReturnType<typeof buildFormStateHandler> // TODO: infer this type when `strictNullChecks` is enabled

          if (!remoteSignal?.aborted) {
            return result
          }
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }

      return { state: null }
    },
    [serverFunction],
  )

  const getTableState = useCallback<GetTableStateClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args || {}

      try {
        if (!remoteSignal?.aborted) {
          const result = (await serverFunction({
            name: 'table-state',
            args: { fallbackLocale: false, ...rest },
          })) as ReturnType<typeof buildTableStateHandler> // TODO: infer this type when `strictNullChecks` is enabled

          if (!remoteSignal?.aborted) {
            return result
          }
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }

      // return { state: args.formState }
    },
    [serverFunction],
  )

  const renderDocument = useCallback<RenderDocument>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args || {}

      try {
        if (!remoteSignal?.aborted) {
          const result = (await serverFunction({
            name: 'render-document',
            args: { fallbackLocale: false, ...rest },
          })) as { docID: string; Document: React.ReactNode }

          if (!remoteSignal?.aborted) {
            return result
          }
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  return (
    <ServerFunctionsContext.Provider
      value={{
        getDocumentSlots,
        getFormState,
        getTableState,
        renderDocument,
        serverFunction,
      }}
    >
      {children}
    </ServerFunctionsContext.Provider>
  )
}
