'use client'

import type {
  ClientEditorConfig,
  ClientFeatureProviderMap,
  FeatureProviderClient,
  ResolvedClientFeatureMap,
} from '@payloadcms/richtext-lexical'

/**
 * This function expects client functions to ALREADY be ordered & dependencies checked on the server
 * @param unSanitizedEditorConfig
 */
export function loadClientFeatures({
  unSanitizedEditorConfig,
}: {
  unSanitizedEditorConfig: ClientEditorConfig
}): ResolvedClientFeatureMap {
  // sort unSanitizedEditorConfig.features by order
  unSanitizedEditorConfig.features = unSanitizedEditorConfig.features.sort(
    (a, b) => a.clientFeatureProps.order - b.clientFeatureProps.order,
  )

  const featureProviderMap: ClientFeatureProviderMap = new Map(
    unSanitizedEditorConfig.features.map(
      (f) => [f.clientFeatureProps.featureKey, f] as [string, FeatureProviderClient<unknown>],
    ),
  )

  const resolvedFeatures: ResolvedClientFeatureMap = new Map()

  // Make sure all dependencies declared in the respective features exist
  let loaded = 0
  for (const featureProvider of unSanitizedEditorConfig.features) {
    const feature = featureProvider.feature({
      featureProviderMap,
      resolvedFeatures,
      unSanitizedEditorConfig,
    })
    resolvedFeatures.set(featureProvider.clientFeatureProps.featureKey, {
      ...feature,
      key: featureProvider.clientFeatureProps.featureKey,
      order: loaded,
    })

    loaded++
  }

  return resolvedFeatures
}
