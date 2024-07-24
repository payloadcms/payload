import type {
  Data,
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
}): Promise<Data> => {
  const { id, collectionConfig, globalConfig, locale, req } = args

  try {
    const formState = await buildFormState({
      req: {
        ...req,
        data: {
          id,
          collectionSlug: collectionConfig?.slug,
          globalSlug: globalConfig?.slug,
          locale: locale?.code,
          operation: (collectionConfig && id) || globalConfig ? 'update' : 'create',
          schemaPath: collectionConfig?.slug || globalConfig?.slug,
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
    return {}
  }
}
