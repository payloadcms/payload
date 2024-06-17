import type {
  Data,
  Locale,
  PayloadRequestWithData,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { reduceFieldsToValues } from '@payloadcms/ui/shared'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'

export const getDocumentData = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  locale: Locale
  req: PayloadRequestWithData
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
