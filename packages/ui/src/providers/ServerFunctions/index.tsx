import type {
  AdminViewServerPropsOnly,
  BuildFormStateArgs,
  BuildTableStateArgs,
  Data,
  DocumentPreferences,
  DocumentSlots,
  FormState,
  GetFolderResultsComponentAndDataArgs,
  Locale,
  Params,
  RenderDocumentVersionsProperties,
  ServerFunction,
  ServerFunctionClient,
  SlugifyServerFunctionArgs,
} from 'payload'
import type { Slugify } from 'payload/shared'

import React, { createContext, useCallback } from 'react'

import type {
  RenderFieldServerFnArgs,
  RenderFieldServerFnReturnType,
} from '../../forms/fieldSchemasToFormState/serverFunctions/renderFieldServerFn.js'
import type { buildFormStateHandler } from '../../utilities/buildFormState.js'
import type { buildTableStateHandler } from '../../utilities/buildTableState.js'
import type { CopyDataFromLocaleArgs } from '../../utilities/copyDataFromLocale.js'
import type { getFolderResultsComponentAndDataHandler } from '../../utilities/getFolderResultsComponentAndData.js'
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

type SlugifyClient = (
  args: {
    signal?: AbortSignal
  } & Omit<SlugifyServerFunctionArgs, 'clientConfig' | 'req'>,
) => ReturnType<Slugify>

export type RenderDocumentResult = {
  data: any
  Document: React.ReactNode
  preferences: DocumentPreferences
}

type RenderDocumentBaseArgs = {
  collectionSlug: string
  disableActions?: boolean
  docID: number | string
  drawerSlug?: string
  initialData?: Data
  initialState?: FormState
  locale?: Locale
  overrideEntityVisibility?: boolean
  paramsOverride?: AdminViewServerPropsOnly['params']
  redirectAfterCreate?: boolean
  redirectAfterDelete: boolean
  redirectAfterDuplicate: boolean
  redirectAfterRestore?: boolean
  searchParams?: Params
  /**
   * Properties specific to the versions view
   */
  versions?: RenderDocumentVersionsProperties
}

export type RenderDocumentServerFunction = ServerFunction<
  RenderDocumentBaseArgs,
  Promise<RenderDocumentResult>
>

type RenderDocumentServerFunctionHookFn = (
  // No req or importMap - those are augmented by handleServerFunctions
  args: {
    signal?: AbortSignal
  } & RenderDocumentBaseArgs,
) => Promise<RenderDocumentResult>

type CopyDataFromLocaleClient = (
  args: {
    signal?: AbortSignal
  } & Omit<CopyDataFromLocaleArgs, 'req'>,
) => Promise<{ data: Data }>

type GetDocumentSlots = (args: {
  collectionSlug: string
  id?: number | string
  signal?: AbortSignal
}) => Promise<DocumentSlots>

type GetFolderResultsComponentAndDataClient = (
  args: {
    signal?: AbortSignal
  } & Omit<GetFolderResultsComponentAndDataArgs, 'req'>,
) => ReturnType<typeof getFolderResultsComponentAndDataHandler>

type RenderFieldClient = (args: RenderFieldServerFnArgs) => Promise<RenderFieldServerFnReturnType>

export type ServerFunctionsContextType = {
  _internal_renderField: RenderFieldClient
  copyDataFromLocale: CopyDataFromLocaleClient
  getDocumentSlots: GetDocumentSlots
  getFolderResultsComponentAndData: GetFolderResultsComponentAndDataClient
  getFormState: GetFormStateClient
  getTableState: GetTableStateClient
  renderDocument: RenderDocumentServerFunctionHookFn
  schedulePublish: SchedulePublishClient
  serverFunction: ServerFunctionClient
  slugify: SlugifyClient
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

      return { error }
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

  const renderDocument = useCallback<RenderDocumentServerFunctionHookFn>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args || {}
      try {
        const result = (await serverFunction({
          name: 'render-document',
          args: {
            fallbackLocale: false,
            ...rest,
          } as Parameters<RenderDocumentServerFunctionHookFn>[0],
        })) as Awaited<ReturnType<RenderDocumentServerFunctionHookFn>> // TODO: infer this type when `strictNullChecks` is enabled

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

  const getFolderResultsComponentAndData = useCallback<GetFolderResultsComponentAndDataClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args || {}

      try {
        const result = (await serverFunction({
          name: 'get-folder-results-component-and-data',
          args: rest,
        })) as Awaited<ReturnType<typeof getFolderResultsComponentAndDataHandler>>

        if (!remoteSignal?.aborted) {
          return result
        }
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  const _internal_renderField = useCallback<RenderFieldClient>(
    async (args) => {
      try {
        const result = (await serverFunction({
          name: 'render-field',
          args,
        })) as RenderFieldServerFnReturnType

        return result
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  const slugify = useCallback<SlugifyClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args || {}

      try {
        const result = (await serverFunction({
          name: 'slugify',
          args: { ...rest },
        })) as Awaited<ReturnType<Slugify>> // TODO: infer this type when `strictNullChecks` is enabled

        return result
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  return (
    <ServerFunctionsContext
      value={{
        _internal_renderField,
        copyDataFromLocale,
        getDocumentSlots,
        getFolderResultsComponentAndData,
        getFormState,
        getTableState,
        renderDocument,
        schedulePublish,
        serverFunction,
        slugify,
      }}
    >
      {children}
    </ServerFunctionsContext>
  )
}
