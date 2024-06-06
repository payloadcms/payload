import type { Locale } from 'payload/config'
import type {
  Data,
  PayloadRequestWithData,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { reduceFieldsToValues } from '@payloadcms/ui/utilities/reduceFieldsToValues'

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
          locale: locale.code,
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
