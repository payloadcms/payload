import type {
  Data,
  FormState,
  ImportMap,
  Locale,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { reduceFieldsToValues } from 'payload/shared'

export const getDocumentData = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  importMap: ImportMap
  locale: Locale
  req: PayloadRequest
  schemaPath?: string
}): Promise<{
  data: Data
  formState: FormState
}> => {
  const {
    id,
    collectionConfig,
    config,
    globalConfig,
    locale,
    req,
    schemaPath: schemaPathFromProps,
  } = args

  const schemaPath = schemaPathFromProps || collectionConfig?.slug || globalConfig?.slug

  try {
    const { state: formState } = await buildFormState({
      id,
      collectionSlug: collectionConfig?.slug,
      config,
      globalSlug: globalConfig?.slug,
      i18n: req.i18n,
      locale: locale?.code,
      operation: (collectionConfig && id) || globalConfig ? 'update' : 'create',
      payload: req.payload,
      schemaPath,
      user: req.user,
    })

    const data = reduceFieldsToValues(formState, true)

    return {
      data,
      formState,
    }
  } catch (error) {
    console.error('Error getting document data', error) // eslint-disable-line no-console
    return {
      data: null,
      formState: {
        fields: {
          initialValue: undefined,
          valid: false,
          value: undefined,
        },
      },
    }
  }
}
