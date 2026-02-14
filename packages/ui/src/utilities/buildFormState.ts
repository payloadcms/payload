import type {
  BuildFormStateArgs,
  ClientConfig,
  ClientUser,
  ErrorResult,
  FormState,
  ServerFunction,
} from 'payload'

import { afterRead, canAccessAdmin, formatErrors, UnauthorizedError } from 'payload'
import { getSelectMode, reduceFieldsToValues } from 'payload/shared'

import { fieldSchemasToFormState } from '../forms/fieldSchemasToFormState/index.js'
import { renderField } from '../forms/fieldSchemasToFormState/renderField.js'
import { getClientConfig } from './getClientConfig.js'
import { getClientSchemaMap } from './getClientSchemaMap.js'
import { getSchemaMap } from './getSchemaMap.js'
import { handleFormStateLocking } from './handleFormStateLocking.js'
import { handleLivePreview } from './handleLivePreview.js'
import { handlePreview } from './handlePreview.js'

export type LockedState = {
  isLocked: boolean
  lastEditedAt: string
  user?: ClientUser | number | string
}

type BuildFormStateSuccessResult = {
  clientConfig?: ClientConfig
  errors?: never
  indexPath?: string
  livePreviewURL?: string
  lockedState?: LockedState
  previewURL?: string
  state: FormState
}

type BuildFormStateErrorResult = {
  livePreviewURL?: never
  lockedState?: never
  previewURL?: never
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
    schemaPath = collectionSlug || globalSlug,
    select,
    skipClientConfigAuth,
    skipValidation,
    updateLastEdited,
  } = args

  const selectMode = select ? getSelectMode(select) : undefined

  if (!collectionSlug && !globalSlug) {
    throw new Error('Either collectionSlug or globalSlug must be provided')
  }

  const schemaMap = getSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n,
  })

  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: getClientConfig({
      config,
      i18n,
      importMap: req.payload.importMap,
      user: skipClientConfigAuth ? true : req.user,
    }),
    globalSlug,
    i18n,
    payload,
    schemaMap,
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

  const isTopLevelSchema = schemaPath === collectionSlug || schemaPath === globalSlug

  if (isTopLevelSchema) {
    const collectionConfig = collectionSlug ? payload.collections[collectionSlug]?.config : null
    const globalConfig = globalSlug
      ? (payload.config.globals?.find((g) => g.slug === globalSlug) ?? null)
      : null

    // Run field-level afterRead hooks
    const hookedData = await afterRead({
      collection: collectionConfig ?? null,
      context: req.context,
      depth: 0,
      doc: data,
      draft: false,
      fallbackLocale: req.fallbackLocale,
      flattenLocales: false,
      global: globalConfig ?? null,
      locale: req.locale,
      overrideAccess: true,
      req,
      showHiddenFields: false,
    })

    // Run collection-level afterRead hooks
    if (collectionConfig?.hooks?.afterRead?.length) {
      let result = hookedData
      for (const hook of collectionConfig.hooks.afterRead) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result,
            overrideAccess: true,
            req,
          })) || result
      }
      Object.assign(data, result)
    } else if (globalConfig?.hooks?.afterRead?.length) {
      let result = hookedData
      for (const hook of globalConfig.hooks.afterRead) {
        result =
          (await hook({
            context: req.context,
            doc: result,
            global: globalConfig,
            overrideAccess: true,
            req,
          })) || result
      }
      Object.assign(data, result)
    } else {
      Object.assign(data, hookedData)
    }
  }

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

  let lockedStateResult

  if (returnLockStatus) {
    lockedStateResult = await handleFormStateLocking({
      id,
      collectionSlug,
      globalSlug,
      req,
      updateLastEdited,
    })
  }

  const res: BuildFormStateSuccessResult = {
    lockedState: lockedStateResult,
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
