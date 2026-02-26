import type { I18nClient } from '@payloadcms/translations'

import { type ClientFieldSchemaMap, type FieldSchemaMap, type Payload } from 'payload'

import type { BaseClientFeatureProps } from '../features/typesClient.js'
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { FeatureClientSchemaMap, LexicalRichTextFieldProps } from '../types.js'
type Args = {
  clientFieldSchemaMap: ClientFieldSchemaMap
  fieldSchemaMap: FieldSchemaMap
  i18n: I18nClient
  path: string
  payload: Payload
  sanitizedEditorConfig: SanitizedServerEditorConfig
  schemaPath: string
}

export function initLexicalFeatures(args: Args): {
  clientFeatures: LexicalRichTextFieldProps['clientFeatures']
  featureClientImportMap: Record<string, any>
  featureClientSchemaMap: FeatureClientSchemaMap
} {
  const clientFeatures: LexicalRichTextFieldProps['clientFeatures'] = {}

  // turn args.resolvedFeatureMap into an array of [key, value] pairs, ordered by value.order, lowest order first:
  const resolvedFeatureMapArray = [...args.sanitizedEditorConfig.resolvedFeatureMap].sort(
    (a, b) => a[1].order - b[1].order,
  )

  const featureClientSchemaMap: FeatureClientSchemaMap = {}

  /**
   * All modules added to the import map, keyed by the provided key, if feature.componentImports with type object is used
   */
  const featureClientImportMap: Record<string, any> | undefined = {}

  for (const [featureKey, resolvedFeature] of resolvedFeatureMapArray) {
    clientFeatures[featureKey] = {}

    /**
     * Handle client features
     */
    const ClientFeaturePayloadComponent = resolvedFeature.ClientFeature

    if (ClientFeaturePayloadComponent) {
      const clientFeatureProps: BaseClientFeatureProps<Record<string, any>> =
        resolvedFeature.clientFeatureProps ?? {}
      clientFeatureProps.featureKey = resolvedFeature.key
      clientFeatureProps.order = resolvedFeature.order
      if (
        typeof ClientFeaturePayloadComponent === 'object' &&
        ClientFeaturePayloadComponent.clientProps
      ) {
        clientFeatureProps.clientProps = ClientFeaturePayloadComponent.clientProps
      }
      clientFeatures[featureKey] = { clientFeatureProps }
    }

    /**
     * Handle sub-fields (formstate of those)
     */
    // The args.fieldSchemaMap generated before in buildFormState should contain all of lexical features' sub-field schemas
    // as well, as it already called feature.generateSchemaMap for each feature.
    // We will check for the existance resolvedFeature.generateSchemaMap to skip unnecessary loops for constructing featureSchemaMap, but we don't run it here
    if (resolvedFeature.generateSchemaMap) {
      const featureSchemaPath = `${args.schemaPath}.lexical_internal_feature.${featureKey}`

      featureClientSchemaMap[featureKey] = {}

      // Like args.fieldSchemaMap, we only want to include the sub-fields of the current feature
      for (const [key, entry] of args.clientFieldSchemaMap.entries()) {
        if (key.startsWith(featureSchemaPath)) {
          featureClientSchemaMap[featureKey][key] = 'fields' in entry ? entry.fields : [entry]
        }
      }
    }

    if (
      resolvedFeature.componentImports &&
      typeof resolvedFeature.componentImports === 'object' &&
      !Array.isArray(resolvedFeature.componentImports)
    ) {
      for (const [key, payloadComponent] of Object.entries(resolvedFeature.componentImports)) {
        featureClientImportMap[`${resolvedFeature.key}.${key}`] = payloadComponent
      }
    }
  }
  return {
    clientFeatures,
    featureClientImportMap,
    featureClientSchemaMap,
  }
}
