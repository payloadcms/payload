'use client'

import type { ImportMap, RichTextFieldClient, RichTextFieldClientProps } from 'payload'

import { getFromImportMap } from 'payload/shared'
import React, { useMemo } from 'react'

import type {
  BaseClientFeatureProps,
  FeatureProviderProviderClient,
} from '../features/typesClient.js'
import type { FeatureClientSchemaMap, LexicalRichTextFieldProps } from '../types.js'

import { RichTextField } from './index.js'

type SerializedFeatureMetadata = {
  ClientFeature?: { clientProps?: Record<string, any>; path: string } | string
  clientFeatureProps?: Record<string, any>
  componentImports?: Record<string, { clientProps?: Record<string, any>; path: string } | string>
  key: string
  order: number
}

export type ClientEntryLexicalFieldProps = {
  featureClientSchemaMap?: FeatureClientSchemaMap
  features?: Record<string, SerializedFeatureMetadata>
  importMap: ImportMap
} & RichTextFieldClientProps

/**
 * Client-only entry point for the Lexical rich text field.
 * Resolves feature providers and component imports from the import map on the client,
 * bypassing the RSC entry point that requires server-only data.
 */
export const ClientEntryLexicalField: React.FC<ClientEntryLexicalFieldProps> = (props) => {
  const {
    featureClientSchemaMap = {},
    features = {},
    field,
    forceRender,
    importMap,
    path,
    permissions,
    readOnly,
    schemaPath,
  } = props

  const { clientFeatures, featureClientImportMap } = useMemo(() => {
    const resolvedClientFeatures: LexicalRichTextFieldProps['clientFeatures'] = {}
    const resolvedFeatureImportMap: Record<string, any> = {}

    const sortedFeatures = Object.entries(features).sort(([, a], [, b]) => a.order - b.order)

    for (const [featureKey, featureMeta] of sortedFeatures) {
      resolvedClientFeatures[featureKey] = {}

      if (featureMeta.ClientFeature) {
        const clientFeatureProvider = getFromImportMap<FeatureProviderProviderClient | undefined>({
          importMap,
          PayloadComponent: featureMeta.ClientFeature,
          schemaPath: 'lexical-clientComponent',
          silent: true,
        })

        if (clientFeatureProvider) {
          const clientFeatureProps: BaseClientFeatureProps<Record<string, any>> = {
            ...(featureMeta.clientFeatureProps ?? {}),
            featureKey: featureMeta.key,
            order: featureMeta.order,
          }

          if (
            typeof featureMeta.ClientFeature === 'object' &&
            featureMeta.ClientFeature.clientProps
          ) {
            clientFeatureProps.clientProps = (featureMeta.ClientFeature as any).clientProps
          }

          resolvedClientFeatures[featureKey] = {
            clientFeatureProps,
            clientFeatureProvider,
          }
        }
      }

      if (featureMeta.componentImports && typeof featureMeta.componentImports === 'object') {
        for (const [importKey, payloadComponent] of Object.entries(featureMeta.componentImports)) {
          const resolvedComponent = getFromImportMap({
            importMap,
            PayloadComponent: payloadComponent,
            schemaPath: 'lexical-clientComponent',
            silent: true,
          })
          if (resolvedComponent) {
            resolvedFeatureImportMap[`${featureKey}.${importKey}`] = resolvedComponent
          }
        }
      }
    }

    return {
      clientFeatures: resolvedClientFeatures,
      featureClientImportMap: resolvedFeatureImportMap,
    }
  }, [features, importMap])

  return (
    <RichTextField
      clientFeatures={clientFeatures}
      featureClientImportMap={featureClientImportMap}
      featureClientSchemaMap={featureClientSchemaMap}
      field={field as RichTextFieldClient}
      forceRender={forceRender}
      path={path}
      permissions={permissions as LexicalRichTextFieldProps['permissions']}
      readOnly={readOnly}
      schemaPath={schemaPath}
    />
  )
}
