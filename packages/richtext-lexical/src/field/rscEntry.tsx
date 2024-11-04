import type { EditorConfig as LexicalEditorConfig } from 'lexical'

import { getFromImportMap } from '@payloadcms/ui/elements/RenderServerComponent'
import {
  type ClientComponentProps,
  createClientFields,
  deepCopyObjectSimple,
  type RichTextFieldClient,
  type ServerComponentProps,
} from 'payload'
import React from 'react'

import type { FeatureProviderProviderClient } from '../features/typesClient.js'
import type { ResolvedServerFeatureMap } from '../features/typesServer.js'
import type {
  FeatureClientSchemaMap,
  LexicalFieldAdminProps,
  LexicalRichTextFieldProps,
} from '../types.js'

import { RichTextField } from './index.js'
export const RscEntryLexicalField: React.FC<
  {
    admin: LexicalFieldAdminProps
    lexicalEditorConfig: LexicalEditorConfig
    resolvedFeatureMap: ResolvedServerFeatureMap
  } & ClientComponentProps &
    ServerComponentProps
> = (args) => {
  const clientFeatures: LexicalRichTextFieldProps['clientFeatures'] = {}

  const fieldSchemaMap = Object.fromEntries(new Map(args.fieldSchemaMap))
  //&const value = deepCopyObjectSimple(args.fieldState.value)

  // turn args.resolvedFeatureMap into an array of [key, value] pairs, ordered by value.order, lowest order first:
  const resolvedFeatureMapArray = Array.from(args.resolvedFeatureMap.entries()).sort(
    (a, b) => a[1].order - b[1].order,
  )

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
          clientFields:
            'fields' in state ? deepCopyObjectSimple(state.fields) : [deepCopyObjectSimple(state)],
          defaultIDType: args.config.db.defaultIDType,
          disableAddingIDs: true,
          fields: 'fields' in state ? state.fields : [state],
          i18n: args.i18n,
          parentSchemaPath: key.split('.'),
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

  return (
    <RichTextField
      admin={args.admin}
      clientFeatures={clientFeatures}
      featureClientSchemaMap={featureClientSchemaMap}
      field={args.clientField as RichTextFieldClient}
      fieldState={args.fieldState}
      forceRender={args.forceRender}
      indexPath={args.indexPath}
      lexicalEditorConfig={args.lexicalEditorConfig}
      parentPath={args.parentPath}
      parentSchemaPath={args.parentSchemaPath}
      path={args.path}
      permissions={args.permissions}
      readOnly={args.readOnly}
      renderedBlocks={args.renderedBlocks}
      rowLabels={args.rowLabels}
      schemaPath={args.schemaPath}
    />
  )
}
