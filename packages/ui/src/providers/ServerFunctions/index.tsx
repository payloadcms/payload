import type {
  BuildFormStateArgs,
  BuildTableStateArgs,
  Data,
  DocumentSlots,
  ErrorResult,
  Locale,
  ServerFunctionClient,
} from 'payload'

import React, { createContext, useCallback } from 'react'

import type { buildFormStateHandler } from '../../utilities/buildFormState.js'
import type { buildTableStateHandler } from '../../utilities/buildTableState.js'
import type { CopyDataFromLocaleArgs } from '../../utilities/copyDataFromLocale.js'
import type {
  schedulePublishHandler,
  SchedulePublishHandlerArgs,
} from '../../utilities/schedulePublishHandler.js'

type GetFormStateClient = (
  args: {
    signal?: AbortSignal
  } & Omit<BuildFormStateArgs, 'clientConfig' | 'req'>,
) => ReturnType<typeof buildFormStateHandler>

type SchedulePublishClient = (
  args: {
    signal?: AbortSignal
  } & Omit<SchedulePublishHandlerArgs, 'clientConfig' | 'req'>,
) => ReturnType<typeof schedulePublishHandler>

type GetTableStateClient = (
  args: {
    signal?: AbortSignal
  } & Omit<BuildTableStateArgs, 'clientConfig' | 'req'>,
) => ReturnType<typeof buildTableStateHandler>

type RenderDocument = (args: {
  collectionSlug: string
  disableActions?: boolean
  docID?: number | string
  drawerSlug?: string
  initialData?: Data
  locale?: Locale
  overrideEntityVisibility?: boolean
  redirectAfterCreate?: boolean
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  signal?: AbortSignal
}) => Promise<
  { data: Data; Document: React.ReactNode } | ({ data: never; Document: never } & ErrorResult)
>

type CopyDataFromLocaleClient = (
  args: {
    signal?: AbortSignal
  } & Omit<CopyDataFromLocaleArgs, 'req'>,
) => Promise<{ data: Data }>

type GetDocumentSlots = (args: {
  collectionSlug: string
  signal?: AbortSignal
}) => Promise<DocumentSlots>

type ServerFunctionsContextType = {
  copyDataFromLocale: CopyDataFromLocaleClient
  getDocumentSlots: GetDocumentSlots
  getFormState: GetFormStateClient
  getTableState: GetTableStateClient
  renderDocument: RenderDocument
  schedulePublish: SchedulePublishClient
  serverFunction: ServerFunctionClient
}

export const ServerFunctionsContext = createContext<ServerFunctionsContextType | undefined>(
  undefined,
)

export const useServerFunctions = () => {
  const context = React.use(ServerFunctionsContext)
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

  const schedulePublish = useCallback<SchedulePublishClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args

      try {
        if (!remoteSignal?.aborted) {
          const result = (await serverFunction({
            name: 'schedule-publish',
            args: { ...rest },
          })) as Awaited<ReturnType<typeof schedulePublishHandler>> // TODO: infer this type when `strictNullChecks` is enabled

          if (!remoteSignal?.aborted) {
            return result
          }
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }

      let error = `Error scheduling ${rest.type}`

      if (rest.doc) {
        error += ` for document with ID ${rest.doc.value} in collection ${rest.doc.relationTo}`
      }

      return { error: '' }
    },
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
          })) as Awaited<ReturnType<typeof buildFormStateHandler>> // TODO: infer this type when `strictNullChecks` is enabled

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
          })) as Awaited<ReturnType<typeof buildTableStateHandler>> // TODO: infer this type when `strictNullChecks` is enabled

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
        const result = (await serverFunction({
          name: 'render-document',
          args: { fallbackLocale: false, ...rest },
        })) as Awaited<ReturnType<typeof renderDocument>> // TODO: infer this type when `strictNullChecks` is enabled

        return result
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  const copyDataFromLocale = useCallback<CopyDataFromLocaleClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args || {}

      try {
        const result = (await serverFunction({
          name: 'copy-data-from-locale',
          args: rest,
        })) as { data: Data }

        if (!remoteSignal?.aborted) {
          return result
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  return (
    <ServerFunctionsContext
      value={{
        copyDataFromLocale,
        getDocumentSlots,
        getFormState,
        getTableState,
        renderDocument,
        schedulePublish,
        serverFunction,
      }}
    >
      {children}
    </ServerFunctionsContext>
  )
}
