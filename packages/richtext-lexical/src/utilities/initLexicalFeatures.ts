import type { I18nClient } from '@payloadcms/translations'

import {
  type ClientField,
  createClientFields,
  deepCopyObjectSimple,
  type FieldSchemaMap,
  type Payload,
} from 'payload'
import { getFromImportMap } from 'payload/shared'

import type { FeatureProviderProviderClient } from '../features/typesClient.js'
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { FeatureClientSchemaMap, LexicalRichTextFieldProps } from '../types.js'
type Args = {
  fieldSchemaMap: FieldSchemaMap
  i18n: I18nClient
  path: string
  payload: Payload
  sanitizedEditorConfig: SanitizedServerEditorConfig
  schemaPath: string
}

export function initLexicalFeatures(args: Args): {
  clientFeatures: LexicalRichTextFieldProps['clientFeatures']
  featureClientSchemaMap: FeatureClientSchemaMap
} {
  const clientFeatures: LexicalRichTextFieldProps['clientFeatures'] = {}

  const fieldSchemaMap = Object.fromEntries(new Map(args.fieldSchemaMap))
  //&const value = deepCopyObjectSimple(args.fieldState.value)

  // turn args.resolvedFeatureMap into an array of [key, value] pairs, ordered by value.order, lowest order first:
  const resolvedFeatureMapArray = Array.from(
    args.sanitizedEditorConfig.resolvedFeatureMap.entries(),
  ).sort((a, b) => a[1].order - b[1].order)

  const featureClientSchemaMap: FeatureClientSchemaMap = {}

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

      const clientFeatureProps = resolvedFeature.clientFeatureProps ?? {}
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
     * Handle sub-fields (formstate of those)ttt
     */
    // The args.fieldSchemaMap generated before in buildFormState should contain all of lexical features' sub-field schemas
    // as well, as it already called feature.generateSchemaMap for each feature.
    // We will check for the existance resolvedFeature.generateSchemaMap to skip unnecessary loops for constructing featureSchemaMap, but we don't run it here
    if (resolvedFeature.generateSchemaMap) {
      const featureSchemaPath = [
        ...args.schemaPath.split('.'),
        'lexical_internal_feature',
        featureKey,
      ].join('.')

      const featurePath = [...args.path.split('.'), 'lexical_internal_feature', featureKey].join(
        '.',
      )

      // Like args.fieldSchemaMap, we only want to include the sub-fields of the current feature
      const featureSchemaMap: typeof fieldSchemaMap = {}
      for (const key in fieldSchemaMap) {
        const state = fieldSchemaMap[key]

        if (key.startsWith(featureSchemaPath)) {
          featureSchemaMap[key] = state
        }
      }

      featureClientSchemaMap[featureKey] = {}

      for (const key in featureSchemaMap) {
        const state = featureSchemaMap[key]

        const clientFields = createClientFields({
          clientFields: ('fields' in state
            ? deepCopyObjectSimple(state.fields)
            : [deepCopyObjectSimple(state)]) as ClientField[],
          defaultIDType: args.payload.config.db.defaultIDType,
          disableAddingID: true,
          fields: 'fields' in state ? state.fields : [state],
          i18n: args.i18n,
          importMap: args.payload.importMap,
        })
        featureClientSchemaMap[featureKey][key] = clientFields
      }

      /*
      This is for providing an initial form state. Right now we only want to provide the clientfields though
      const schemaMap: {
        [key: string]: FieldState
      } = {}

      const lexicalDeepIterate = (editorState) => {
        console.log('STATE', editorState)

        if (
          editorState &&
          typeof editorState === 'object' &&
          'children' in editorState &&
          Array.isArray(editorState.children)
        ) {
          for (const childKey in editorState.children) {
            const childState = editorState.children[childKey]

            if (childState && typeof childState === 'object') {
              lexicalDeepIterate(childState)
            }
          }
        }
      }

      lexicalDeepIterate(value.root)*/
    }
  }
  return {
    clientFeatures,
    featureClientSchemaMap,
  }
}
