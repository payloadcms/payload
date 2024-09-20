import type {
  Data,
  FormState,
  Locale,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { reduceFieldsToValues } from 'payload/shared'

export const getDocumentData = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  locale: Locale
  req: PayloadRequest
  schemaPath?: string
}): Promise<{
  data: Data
  formState: FormState
}> => {
  const { id, collectionConfig, globalConfig, locale, req, schemaPath: schemaPathFromProps } = args

  const schemaPath = schemaPathFromProps || collectionConfig?.slug || globalConfig?.slug

  try {
    const { state: formState } = await buildFormState({
      req: {
        ...req,
        data: {
          id,
          collectionSlug: collectionConfig?.slug,
          globalSlug: globalConfig?.slug,
          locale: locale?.code,
          operation: (collectionConfig && id) || globalConfig ? 'update' : 'create',
          schemaPath,
        },
      },
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
