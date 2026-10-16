import type {
  AdminViewServerPropsOnly,
  BuildFormStateArgs,
  BuildTableStateArgs,
  Data,
  DocumentPreferences,
  DocumentSlots,
  FormState,
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
import type {
  getUpcomingScheduledPublishHandler,
  GetUpcomingScheduledPublishHandlerArgs,
  schedulePublishHandler,
  SchedulePublishHandlerArgs,
} from '../../utilities/schedulePublishHandler.js'

import { buildFormStateRequest } from './buildFormStateRequest.js'

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

type GetUpcomingScheduledPublishClient = (
  args: {
    signal?: AbortSignal
  } & Omit<GetUpcomingScheduledPublishHandlerArgs, 'clientConfig' | 'req'>,
) => ReturnType<typeof getUpcomingScheduledPublishHandler>

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

type RenderFieldClient = (args: RenderFieldServerFnArgs) => Promise<RenderFieldServerFnReturnType>

type SwitchLanguageClient = (lang: string) => Promise<void>

export type ServerFunctionsContextType = {
  _internal_renderField: RenderFieldClient
  copyDataFromLocale: CopyDataFromLocaleClient
  getDocumentSlots: GetDocumentSlots
  getFormState: GetFormStateClient
  getTableState: GetTableStateClient
  getUpcomingScheduledPublish: GetUpcomingScheduledPublishClient
  renderDocument: RenderDocumentServerFunctionHookFn
  schedulePublish: SchedulePublishClient
  serverFunction: ServerFunctionClient
  slugify: SlugifyClient
  switchLanguage: SwitchLanguageClient
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
        args: { id: args.id, collectionSlug: args.collectionSlug },
      }),
    [serverFunction],
  )

  const schedulePublish = useCallback<SchedulePublishClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args

      try {
        if (!remoteSignal?.aborted) {
          const result = await serverFunction({
            name: 'schedule-publish',
            args: {
              type: rest.type,
              date: rest.date ? new Date(rest.date.getTime()) : rest.date,
              deleteID: rest.deleteID,
              doc: rest.doc
                ? { relationTo: rest.doc.relationTo, value: rest.doc.value }
                : undefined,
              global: rest.global,
              localeToPublish: rest.localeToPublish,
              timezone: rest.timezone,
            } satisfies SchedulePublishHandlerArgs,
          })

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

  const getUpcomingScheduledPublish = useCallback<GetUpcomingScheduledPublishClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args

      if (remoteSignal?.aborted) {
        return []
      }

      const result = (await serverFunction({
        name: 'get-upcoming-scheduled-publish',
        args: {
          id: rest.id,
          collectionSlug: rest.collectionSlug,
          globalSlug: rest.globalSlug,
        } satisfies GetUpcomingScheduledPublishHandlerArgs,
      })) as Awaited<ReturnType<typeof getUpcomingScheduledPublishHandler>>

      return remoteSignal?.aborted ? [] : result
    },
    [serverFunction],
  )

  const getFormState = useCallback<GetFormStateClient>(
    async (args) => {
      const { signal: remoteSignal, ...rest } = args

      try {
        if (!remoteSignal?.aborted) {
          const result = (await serverFunction({
            name: 'form-state',
            args: {
              id: rest.id,
              checkForStaleData: rest.checkForStaleData,
              collectionSlug: rest.collectionSlug,
              data: rest.data,
              docPermissions: rest.docPermissions,
              docPreferences: rest.docPreferences,
              documentFormState: buildFormStateRequest({ formState: rest.documentFormState }),
              fallbackLocale: rest.fallbackLocale ?? false,
              formState: buildFormStateRequest({ formState: rest.formState }),
              globalSlug: rest.globalSlug,
              initialBlockData: rest.initialBlockData,
              initialBlockFormState: buildFormStateRequest({
                formState: rest.initialBlockFormState,
              }),
              language: rest.language,
              locale: rest.locale,
              mockRSCs: rest.mockRSCs,
              operation: rest.operation,
              originalUpdatedAt: rest.originalUpdatedAt,
              readOnly: rest.readOnly,
              renderAllFields: rest.renderAllFields,
              returnLivePreviewURL: rest.returnLivePreviewURL,
              returnLockStatus: rest.returnLockStatus,
              returnPreviewURL: rest.returnPreviewURL,
              schemaPath: rest.schemaPath,
              select: rest.select,
              skipClientConfigAuth: rest.skipClientConfigAuth,
              skipValidation: rest.skipValidation,
              updateLastEdited: rest.updateLastEdited,
              widgetSlug: rest.widgetSlug,
            } satisfies Parameters<GetFormStateClient>[0],
          })) as Awaited<ReturnType<typeof buildFormStateHandler>> // TODO: infer this type when `strictNullChecks` is enabled

          if (!remoteSignal?.aborted) {
            const file = rest.formState?.file

            if (typeof File !== 'undefined' && result.state?.file) {
              if (file?.initialValue instanceof File) {
                result.state.file.initialValue = file.initialValue
              }

              if (file?.value instanceof File) {
                result.state.file.value = file.value
              }
            }

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
      const { signal: remoteSignal, ...rest } = args

      try {
        if (!remoteSignal?.aborted) {
          const result = (await serverFunction({
            name: 'table-state',
            args: {
              collectionSlug: rest.collectionSlug,
              columns: rest.columns,
              data: rest.data,
              docs: rest.docs,
              enableRowSelections: rest.enableRowSelections,
              orderableFieldName: rest.orderableFieldName,
              parent: rest.parent,
              query: rest.query,
              renderRowTypes: rest.renderRowTypes,
              tableAppearance: rest.tableAppearance,
            } satisfies BuildTableStateArgs,
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
    async (rest) => {
      try {
        const result = (await serverFunction({
          name: 'render-document',
          args: {
            collectionSlug: rest.collectionSlug,
            disableActions: rest.disableActions,
            docID: rest.docID,
            drawerSlug: rest.drawerSlug,
            initialData: rest.initialData,
            initialState: buildFormStateRequest({ formState: rest.initialState }),
            overrideEntityVisibility: rest.overrideEntityVisibility,
            paramsOverride: rest.paramsOverride,
            redirectAfterCreate: rest.redirectAfterCreate,
            redirectAfterDelete: rest.redirectAfterDelete,
            redirectAfterDuplicate: rest.redirectAfterDuplicate,
            redirectAfterRestore: rest.redirectAfterRestore,
            searchParams: rest.searchParams,
            versions: rest.versions,
          } satisfies RenderDocumentBaseArgs,
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
      const { signal: remoteSignal, ...rest } = args

      const result = (await serverFunction({
        name: 'copy-data-from-locale',
        args: {
          collectionSlug: rest.collectionSlug,
          docID: rest.docID,
          fromLocale: rest.fromLocale,
          globalSlug: rest.globalSlug,
          overrideData: rest.overrideData,
          toLocale: rest.toLocale,
        } satisfies Omit<CopyDataFromLocaleArgs, 'req'>,
      })) as Data

      if (!remoteSignal?.aborted) {
        return { data: result }
      }
    },
    [serverFunction],
  )

  const _internal_renderField = useCallback<RenderFieldClient>(
    async (args) => {
      try {
        const result = (await serverFunction({
          name: 'render-field',
          args: {
            name: args.name,
            hidden: args.hidden,
            initialValue: args.initialValue,
            label: args.label,
            path: args.path,
            schemaPath: args.schemaPath,
          } satisfies RenderFieldServerFnArgs,
        })) as RenderFieldServerFnReturnType

        return result
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  const slugify = useCallback<SlugifyClient>(
    async (rest) => {
      try {
        const result = (await serverFunction({
          name: 'slugify',
          args: {
            id: rest.id,
            collectionSlug: rest.collectionSlug,
            data: rest.data,
            globalSlug: rest.globalSlug,
            locale: rest.locale,
            path: rest.path,
            valueToSlugify: rest.valueToSlugify,
          } satisfies SlugifyServerFunctionArgs,
        })) as Awaited<ReturnType<Slugify>> // TODO: infer this type when `strictNullChecks` is enabled

        return result
      } catch (_err) {
        console.error(_err) // eslint-disable-line no-console
      }
    },
    [serverFunction],
  )

  const switchLanguage = useCallback<SwitchLanguageClient>(
    async (lang) => {
      await serverFunction({
        name: 'switch-language',
        args: { lang },
      })
    },
    [serverFunction],
  )

  return (
    <ServerFunctionsContext
      value={{
        _internal_renderField,
        copyDataFromLocale,
        getDocumentSlots,
        getFormState,
        getTableState,
        getUpcomingScheduledPublish,
        renderDocument,
        schedulePublish,
        serverFunction,
        slugify,
        switchLanguage,
      }}
    >
      {children}
    </ServerFunctionsContext>
  )
}
