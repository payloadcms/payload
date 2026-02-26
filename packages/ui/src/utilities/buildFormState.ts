import type {
  BuildFormStateArgs,
  ClientConfig,
  ClientUser,
  ErrorResult,
  FormState,
  ServerFunction,
} from 'payload'

import { canAccessAdmin, formatErrors, UnauthorizedError } from 'payload'
import { getSelectMode, reduceFieldsToValues } from 'payload/shared'

import { fieldSchemasToFormState } from '../forms/fieldSchemasToFormState/index.js'
import { renderField } from '../forms/fieldSchemasToFormState/renderField.js'
import { getClientConfig } from './getClientConfig.js'
import { getClientSchemaMap } from './getClientSchemaMap.js'
import { getSchemaMap } from './getSchemaMap.js'
import { handleFormStateLocking } from './handleFormStateLocking.js'
import { handleLivePreview } from './handleLivePreview.js'
import { handlePreview } from './handlePreview.js'
import { handleStaleDataCheck } from './handleStaleDataCheck.js'

export type LockedState = {
  isLocked: boolean
  lastEditedAt: string
  user?: ClientUser | number | string
}

export type StaleDataState = {
  currentUpdatedAt: string
  isStale: boolean
}

type BuildFormStateSuccessResult = {
  clientConfig?: ClientConfig
  errors?: never
  indexPath?: string
  livePreviewURL?: string
  lockedState?: LockedState
  previewURL?: string
  staleDataState?: StaleDataState
  state: FormState
}

type BuildFormStateErrorResult = {
  livePreviewURL?: never
  lockedState?: never
  previewURL?: never
  staleDataState?: never
  state?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export type BuildFormStateResult = BuildFormStateErrorResult | BuildFormStateSuccessResult

export const buildFormStateHandler: ServerFunction<
  BuildFormStateArgs,
  Promise<BuildFormStateResult>
> = async (args) => {
  const { req } = args

  try {
    await canAccessAdmin({ req })
    const res = await buildFormState(args)

    return res
  } catch (err) {
    req.payload.logger.error({ err, msg: `There was an error building form state` })

    if (err.message === 'Could not find field schema for given path') {
      return {
        message: err.message,
      }
    }

    if (err.message === 'Unauthorized') {
      throw new UnauthorizedError()
    }

    return formatErrors(err)
  }
}

export const buildFormState = async (
  args: BuildFormStateArgs,
): Promise<BuildFormStateSuccessResult> => {
  const {
    id: idFromArgs,
    checkForStaleData,
    collectionSlug,
    data: incomingData,
    docPermissions,
    docPreferences,
    documentFormState,
    formState,
    globalSlug,
    initialBlockData,
    initialBlockFormState,
    mockRSCs,
    operation,
    originalUpdatedAt,
    readOnly,
    renderAllFields,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
    },
    returnLivePreviewURL,
    returnLockStatus,
    returnPreviewURL,
    widgetSlug,
    schemaPath = collectionSlug || globalSlug || widgetSlug,
    select,
    skipClientConfigAuth,
    skipValidation,
    updateLastEdited,
  } = args

  const selectMode = select ? getSelectMode(select) : undefined

  if (!collectionSlug && !globalSlug && !widgetSlug) {
    throw new Error('Either collectionSlug, globalSlug, or widgetSlug must be provided')
  }

  const schemaMap = getSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n,
    widgetSlug,
  })

  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: getClientConfig({
      config,
      i18n,
      user: skipClientConfigAuth ? true : req.user,
    }),
    globalSlug,
    i18n,
    payload,
    schemaMap,
    widgetSlug,
  })

  const id = collectionSlug ? idFromArgs : undefined
  const fieldOrEntityConfig = schemaMap.get(schemaPath)

  if (!fieldOrEntityConfig) {
    throw new Error(`Could not find "${schemaPath}" in the fieldSchemaMap`)
  }

  if (
    (!('fields' in fieldOrEntityConfig) ||
      !fieldOrEntityConfig.fields ||
      !fieldOrEntityConfig.fields.length) &&
    'type' in fieldOrEntityConfig &&
    fieldOrEntityConfig.type !== 'blocks'
  ) {
    throw new Error(
      `The field found in fieldSchemaMap for "${schemaPath}" does not contain any subfields.`,
    )
  }

  // If there is form state but no data, deduce data from that form state, e.g. on initial load
  // Otherwise, use the incoming data as the source of truth, e.g. on subsequent saves
  const data = incomingData || reduceFieldsToValues(formState, true)

  let documentData = undefined

  if (documentFormState) {
    documentData = reduceFieldsToValues(documentFormState, true)
  }

  let blockData = initialBlockData

  if (initialBlockFormState) {
    blockData = reduceFieldsToValues(initialBlockFormState, true)
  }

  /**
   * When building state for sub schemas we need to adjust:
   * - `fields`
   * - `parentSchemaPath`
   * - `parentPath`
   *
   * Type assertion is fine because we wrap sub schemas in an array
   * so we can safely map over them within `fieldSchemasToFormState`
   */
  const fields = Array.isArray(fieldOrEntityConfig)
    ? fieldOrEntityConfig
    : 'fields' in fieldOrEntityConfig
      ? fieldOrEntityConfig.fields
      : [fieldOrEntityConfig]

  // Ensure data.id is present during form state requests, where the data
  // is passed from the client as an argument, without the ID
  if (!data.id && id) {
    data.id = id
  }

  const formStateResult = await fieldSchemasToFormState({
    id,
    clientFieldSchemaMap: clientSchemaMap,
    collectionSlug,
    data,
    documentData,
    fields,
    fieldSchemaMap: schemaMap,
    initialBlockData: blockData,
    mockRSCs,
    operation,
    permissions: docPermissions?.fields || {},
    preferences: docPreferences || { fields: {} },
    previousFormState: formState,
    readOnly,
    renderAllFields,
    renderFieldFn: renderField,
    req,
    schemaPath,
    select,
    selectMode,
    skipValidation,
  })

  // Maintain form state of auth / upload fields
  if (collectionSlug && formState) {
    if (payload.collections[collectionSlug]?.config?.upload && formState.file) {
      formStateResult.file = formState.file
    }
  }

  let lockedStateResult: LockedState | undefined

  if (returnLockStatus) {
    lockedStateResult = await handleFormStateLocking({
      id,
      collectionSlug,
      globalSlug,
      req,
      updateLastEdited,
    })
  }

  let staleDataStateResult: StaleDataState | undefined

  if (checkForStaleData && originalUpdatedAt && ((collectionSlug && id) || globalSlug)) {
    staleDataStateResult = await handleStaleDataCheck({
      id,
      collectionSlug,
      globalSlug,
      originalUpdatedAt,
      req,
    })
  }

  const res: BuildFormStateSuccessResult = {
    lockedState: lockedStateResult,
    staleDataState: staleDataStateResult,
    state: formStateResult,
  }

  if (returnLivePreviewURL) {
    const { livePreviewURL } = await handleLivePreview({
      collectionSlug,
      config,
      data,
      globalSlug,
      req,
    })

    // Important: only set this when not undefined,
    // Otherwise it will travel through the network as `$undefined`
    if (livePreviewURL) {
      res.livePreviewURL = livePreviewURL
    }
  }

  if (returnPreviewURL) {
    const { previewURL } = await handlePreview({
      collectionSlug,
      config,
      data,
      globalSlug,
      req,
    })

    // Important: only set this when not undefined,
    // Otherwise it will travel through the network as `$undefined`
    if (previewURL) {
      res.previewURL = previewURL
    }
  }

  return res
}
