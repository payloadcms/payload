import type { I18nClient } from '@payloadcms/translations'

import { type ClientFieldSchemaMap, type FieldSchemaMap, type Payload } from 'payload'
import { getFromImportMap } from 'payload/shared'

import type {
  BaseClientFeatureProps,
  FeatureProviderProviderClient,
} from '../features/typesClient.js'
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { FeatureClientSchemaMap, LexicalRichTextFieldProps } from '../types/index.js'
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
      const clientFeatureProvider = getFromImportMap<FeatureProviderProviderClient>({
        importMap: args.payload.importMap,
        PayloadComponent: ClientFeaturePayloadComponent,
        schemaPath: 'lexical-clientComponent',
        silent: true,
      })

      if (!clientFeatureProvider) {
        continue
      }

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
      // As clientFeatureProvider is a client function, we cannot execute it on the server here. Thus, the client will have to execute clientFeatureProvider with its props
      clientFeatures[featureKey] = { clientFeatureProps, clientFeatureProvider }
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
      const featureEntries: ClientFieldSchemaMap =
        getFeatureEntriesByPath({ clientFieldSchemaMap: args.clientFieldSchemaMap }).get(
          featureSchemaPath,
        ) ?? new Map()

      for (const [key, entry] of featureEntries) {
        featureClientSchemaMap[featureKey][key] = 'fields' in entry ? entry.fields : [entry]
      }
    }

    if (
      resolvedFeature.componentImports &&
      typeof resolvedFeature.componentImports === 'object' &&
      !Array.isArray(resolvedFeature.componentImports)
    ) {
      for (const [key, payloadComponent] of Object.entries(resolvedFeature.componentImports)) {
        const resolvedComponent = getFromImportMap({
          importMap: args.payload.importMap,
          PayloadComponent: payloadComponent,
          schemaPath: 'lexical-clientComponent',
          silent: true,
        })

        featureClientImportMap[`${resolvedFeature.key}.${key}`] = resolvedComponent
      }
    }
  }
  return {
    clientFeatures,
    featureClientImportMap,
    featureClientSchemaMap,
  }
}

const FEATURE_PATH_SEGMENT = '.lexical_internal_feature.'

const featureEntriesCache = new WeakMap<ClientFieldSchemaMap, Map<string, ClientFieldSchemaMap>>()

/**
 * Groups the client field schema map entries by the lexical feature they belong to,
 * so each rich text field does not have to scan the whole client field schema map.
 */
function getFeatureEntriesByPath({
  clientFieldSchemaMap,
}: {
  clientFieldSchemaMap: ClientFieldSchemaMap
}): Map<string, ClientFieldSchemaMap> {
  const cachedEntriesByPath = featureEntriesCache.get(clientFieldSchemaMap)

  if (cachedEntriesByPath) {
    return cachedEntriesByPath
  }

  const entriesByPath = new Map<string, ClientFieldSchemaMap>()

  for (const [key, entry] of clientFieldSchemaMap) {
    let segmentIndex = key.indexOf(FEATURE_PATH_SEGMENT)

    // An entry of a rich text field nested in a feature also belongs to each outer feature
    while (segmentIndex !== -1) {
      const featureKeyStart = segmentIndex + FEATURE_PATH_SEGMENT.length
      const featureKeyEnd = key.indexOf('.', featureKeyStart)
      const featurePath = featureKeyEnd === -1 ? key : key.slice(0, featureKeyEnd)

      let featureEntries = entriesByPath.get(featurePath)

      if (!featureEntries) {
        featureEntries = new Map()
        entriesByPath.set(featurePath, featureEntries)
      }

      featureEntries.set(key, entry)

      segmentIndex = key.indexOf(FEATURE_PATH_SEGMENT, featureKeyStart)
    }
  }

  featureEntriesCache.set(clientFieldSchemaMap, entriesByPath)

  return entriesByPath
}
