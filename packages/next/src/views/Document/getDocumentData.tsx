import type {
  ClientConfig,
  Data,
  FormState,
  ImportMap,
  Locale,
  PayloadRequest,
  RenderedField,
  RenderedFieldMap,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { buildFormStateFn as buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { reduceFieldsToValues } from 'payload/shared'

export const getDocumentData = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  importMap: ImportMap
  locale: Locale
  req: PayloadRequest
  schemaPath?: string
}): Promise<{
  data: Data
  formState: FormState
  renderedFieldMap?: RenderedFieldMap
}> => {
  const { id, collectionConfig, globalConfig, locale, req, schemaPath: schemaPathFromProps } = args

  const schemaPath = schemaPathFromProps || collectionConfig?.slug || globalConfig?.slug

  try {
    const result = await buildFormState({
      id,
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug,
      locale: locale?.code,
      operation: (collectionConfig && id) || globalConfig ? 'update' : 'create',
      renderFields: true,
      req,
      schemaPath,
    })

    const data = reduceFieldsToValues(result.state, true)

    return {
      data,
      formState: result.state,
    }
  } catch (error) {
    console.error('Error getting document data', error) // eslint-disable-line no-console

    return {
      data: null,
      formState: {
        fields: {
          initialValue: undefined,
          schemaPath: '',
          valid: false,
          value: undefined,
        },
      },
    }
  }
}
