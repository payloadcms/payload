import type { I18n, I18nClient } from '@payloadcms/translations'
import type {
  BuildFormStateArgs,
  ClientConfig,
  ClientUser,
  ErrorResult,
  FieldSchemaMap,
  FormState,
  SanitizedConfig,
} from 'payload'

import { formatErrors } from 'payload'
import { reduceFieldsToValues } from 'payload/shared'

import { fieldSchemasToFormState } from '../forms/fieldSchemasToFormState/index.js'
import { renderField } from '../forms/fieldSchemasToFormState/renderField.js'
import { buildFieldSchemaMap } from './buildFieldSchemaMap/index.js'
import { handleFormStateLocking } from './handleFormStateLocking.js'

let cachedFieldMap = global._payload_fieldMap
let cachedClientConfig = global._payload_clientConfig

if (!cachedFieldMap) {
  cachedFieldMap = global._payload_fieldMap = null
}

if (!cachedClientConfig) {
  cachedClientConfig = global._payload_clientConfig = null
}

export const getFieldSchemaMap = (args: {
  collectionSlug?: string
  config: SanitizedConfig
  globalSlug?: string
  i18n: I18nClient
}): FieldSchemaMap => {
  const { collectionSlug, config, globalSlug, i18n } = args

  if (process.env.NODE_ENV !== 'development') {
    if (!cachedFieldMap) {
      cachedFieldMap = new Map()
    }
    const cachedEntityFieldMap = cachedFieldMap.get(collectionSlug || globalSlug)
    if (cachedEntityFieldMap) {
      return cachedEntityFieldMap
    }
  }

  const { fieldSchemaMap: entityFieldMap } = buildFieldSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n: i18n as I18n,
  })

  if (process.env.NODE_ENV !== 'development') {
    cachedFieldMap.set(collectionSlug || globalSlug, entityFieldMap)
  }

  return entityFieldMap
}

type BuildFormStateSuccessResult = {
  clientConfig?: ClientConfig
  errors?: never
  indexPath?: string
  lockedState?: { isLocked: boolean; lastEditedAt: string; user: ClientUser | number | string }
  state: FormState
}

type BuildFormStateErrorResult = {
  lockedState?: never
  state?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export type BuildFormStateResult = BuildFormStateErrorResult | BuildFormStateSuccessResult

export const buildFormStateHandler = async (
  args: BuildFormStateArgs,
): Promise<BuildFormStateResult> => {
  const { req } = args

  const incomingUserSlug = req.user?.collection
  const adminUserSlug = req.payload.config.admin.user

  try {
    // If we have a user slug, test it against the functions
    if (incomingUserSlug) {
      const adminAccessFunction = req.payload.collections[incomingUserSlug].config.access?.admin

      // Run the admin access function from the config if it exists
      if (adminAccessFunction) {
        const canAccessAdmin = await adminAccessFunction({ req })

        if (!canAccessAdmin) {
          throw new Error('Unauthorized')
        }
        // Match the user collection to the global admin config
      } else if (adminUserSlug !== incomingUserSlug) {
        throw new Error('Unauthorized')
      }
    } else {
      const hasUsers = await req.payload.find({
        collection: adminUserSlug,
        depth: 0,
        limit: 1,
        pagination: false,
      })

      // If there are users, we should not allow access because of /create-first-user
      if (hasUsers.docs.length) {
        throw new Error('Unauthorized')
      }
    }

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
      return null
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
    formState,
    globalSlug,
    operation,
    renderAllFields,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
    },
    returnLockStatus,
    schemaPath = collectionSlug || globalSlug,
    updateLastEdited,
  } = args

  let data = incomingData

  if (!collectionSlug && !globalSlug) {
    throw new Error('Either collectionSlug or globalSlug must be provided')
  }

  const fieldSchemaMap = getFieldSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n,
  })

  const id = collectionSlug ? idFromArgs : undefined
  const fieldOrEntityConfig = fieldSchemaMap.get(schemaPath)

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

  // If there is a form state,
  // then we can deduce data from that form state
  if (formState) {
    data = reduceFieldsToValues(formState, true)
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

  const formStateResult = await fieldSchemasToFormState({
    id,
    collectionSlug,
    data,
    fields,
    fieldSchemaMap,
    operation,
    permissions: docPermissions?.fields || {},
    preferences: docPreferences || { fields: {} },
    previousFormState: formState,
    renderAllFields,
    renderFieldFn: renderField,
    req,
    schemaPath,
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

  return {
    lockedState: lockedStateResult,
    state: formStateResult,
  }
}
