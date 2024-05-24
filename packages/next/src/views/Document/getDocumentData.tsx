import type {
  Data,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { getFormState } from '@payloadcms/ui/utilities/getFormState'
import { reduceFieldsToValues } from '@payloadcms/ui/utilities/reduceFieldsToValues'

export const getDocumentData = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  locale: Locale
  token: string
}): Promise<Data> => {
  const { id, collectionConfig, config, globalConfig, locale, token } = args

  const {
    routes: { api: apiRoute },
    serverURL,
  } = config

  try {
    const formState = await getFormState({
      apiRoute,
      body: {
        id,
        collectionSlug: collectionConfig?.slug,
        globalSlug: globalConfig?.slug,
        locale: locale.code,
        operation: (collectionConfig && id) || globalConfig ? 'update' : 'create',
        schemaPath: collectionConfig?.slug || globalConfig?.slug,
      },
      onError: (error) => {
        console.error('Error getting form state', error)
      },
      serverURL: serverURL || process.env.__NEXT_PRIVATE_ORIGIN,
      token,
    })

    const data = reduceFieldsToValues(formState, true)

    return {
      data,
      formState,
    }
  } catch (error) {
    return {}
  }
}
