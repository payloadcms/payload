'use client'

import type {
  ClientFeatureProviderMap,
  FeatureProviderClient,
  ResolvedClientFeatureMap,
} from '../../../features/typesClient.js'
import type { ClientEditorConfig } from '../types.js'

/**
 * This function expects client functions to ALREADY be ordered & dependencies checked on the server
 * @param unSanitizedEditorConfig
 */
export function loadClientFeatures({
  clientFunctions,
  schemaPath,
  unSanitizedEditorConfig,
}: {
  clientFunctions?: Record<string, any>
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

  const featureProviderMap: ClientFeatureProviderMap = new Map(
    unSanitizedEditorConfig.features.map(
      (f) =>
        [f.clientFeatureProps.featureKey, f] as [string, FeatureProviderClient<unknown, unknown>],
    ),
  )

  const resolvedFeatures: ResolvedClientFeatureMap = new Map()

  // Make sure all dependencies declared in the respective features exist
  let loaded = 0
  for (const featureProvider of unSanitizedEditorConfig.features) {
    /**
     * Load relevant clientFunctions scoped to this feature and then pass them to the client feature
     */
    const relevantClientFunctions: Record<string, any> = {}
    Object.entries(clientFunctions).forEach(([key, plugin]) => {
      if (
        key.startsWith(
          `lexicalFeature.${schemaPath}.${featureProvider.clientFeatureProps.featureKey}.components.`,
        )
      ) {
        const featureComponentKey = key.split(
          `${schemaPath}.${featureProvider.clientFeatureProps.featureKey}.components.`,
        )[1]
        relevantClientFunctions[featureComponentKey] = plugin
      }
    })

    const feature =
      typeof featureProvider.feature === 'function'
        ? featureProvider.feature({
            clientFunctions: relevantClientFunctions,
            featureProviderMap,
            resolvedFeatures,
            unSanitizedEditorConfig,
          })
        : featureProvider.feature

    resolvedFeatures.set(featureProvider.clientFeatureProps.featureKey, {
      ...feature,
      key: featureProvider.clientFeatureProps.featureKey,
      order: loaded,
    })

    loaded++
  }

  return resolvedFeatures
}
