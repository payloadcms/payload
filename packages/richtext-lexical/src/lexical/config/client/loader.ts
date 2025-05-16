'use client'

import type { ClientConfig, RichTextFieldClient } from 'payload'

import type {
  ClientFeatureProviderMap,
  ResolvedClientFeature,
  ResolvedClientFeatureMap,
} from '../../../features/typesClient.js'
import type { FeatureClientSchemaMap } from '../../../types.js'
import type { ClientEditorConfig } from '../types.js'

/**
 * This function expects client functions to ALREADY be ordered & dependencies checked on the server
 * @param unSanitizedEditorConfig
 */
export function loadClientFeatures({
  config,
  featureClientImportMap,
  featureClientSchemaMap,
  field,
  schemaPath,
  unSanitizedEditorConfig,
}: {
  config: ClientConfig
  featureClientImportMap: Record<string, any>
  featureClientSchemaMap: FeatureClientSchemaMap
  field?: RichTextFieldClient
  schemaPath: string
  unSanitizedEditorConfig: ClientEditorConfig
}): ResolvedClientFeatureMap {
  for (const featureProvider of unSanitizedEditorConfig.features) {
    if (
      !featureProvider?.clientFeatureProps?.featureKey ||
      featureProvider?.clientFeatureProps?.order === undefined ||
      featureProvider?.clientFeatureProps?.order === null
    ) {
      throw new Error(
        'A Feature you have installed does not return the client props as clientFeatureProps. Please make sure to always return those props, even if they are null, as other important props like order and featureKey are later on injected.',
      )
    }
  }

  // sort unSanitizedEditorConfig.features by order
  unSanitizedEditorConfig.features = unSanitizedEditorConfig.features.sort(
    (a, b) => a.clientFeatureProps.order - b.clientFeatureProps.order,
  )

  const featureProviderMap: ClientFeatureProviderMap = new Map()
  for (const feature of unSanitizedEditorConfig.features) {
    featureProviderMap.set(feature.clientFeatureProps.featureKey, feature)
  }

  const resolvedFeatures: ResolvedClientFeatureMap = new Map()

  // Make sure all dependencies declared in the respective features exist
  let loaded = 0
  for (const featureProvider of unSanitizedEditorConfig.features) {
    const feature: Partial<ResolvedClientFeature<any>> =
      typeof featureProvider.feature === 'function'
        ? featureProvider.feature({
            config,
            featureClientImportMap,
            featureClientSchemaMap,
            featureProviderMap,
            field,
            resolvedFeatures,
            schemaPath,
            unSanitizedEditorConfig,
          })
        : featureProvider.feature

    feature.key = featureProvider.clientFeatureProps.featureKey
    feature.order = loaded

    resolvedFeatures.set(
      featureProvider.clientFeatureProps.featureKey,
      feature as ResolvedClientFeature<any>,
    )

    loaded++
  }

  return resolvedFeatures
}
