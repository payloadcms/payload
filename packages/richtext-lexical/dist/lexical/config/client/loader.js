'use client';

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
  unSanitizedEditorConfig
}) {
  const featureProviderMap = new Map();
  for (const featureProvider of unSanitizedEditorConfig.features) {
    if (!featureProvider?.clientFeatureProps?.featureKey || featureProvider?.clientFeatureProps?.order === undefined || featureProvider?.clientFeatureProps?.order === null) {
      throw new Error('A Feature you have installed does not return the client props as clientFeatureProps. Please make sure to always return those props, even if they are null, as other important props like order and featureKey are later on injected.');
    }
    featureProviderMap.set(featureProvider.clientFeatureProps.featureKey, featureProvider);
  }
  // sort unSanitizedEditorConfig.features by order
  unSanitizedEditorConfig.features = unSanitizedEditorConfig.features.sort((a, b) => a.clientFeatureProps.order - b.clientFeatureProps.order);
  const resolvedFeatures = new Map();
  // Make sure all dependencies declared in the respective features exist
  let loaded = 0;
  for (const featureProvider of unSanitizedEditorConfig.features) {
    const feature = typeof featureProvider.feature === 'function' ? featureProvider.feature({
      config,
      featureClientImportMap,
      featureClientSchemaMap,
      featureProviderMap,
      field,
      resolvedFeatures,
      schemaPath,
      unSanitizedEditorConfig
    }) : featureProvider.feature;
    feature.key = featureProvider.clientFeatureProps.featureKey;
    feature.order = loaded;
    resolvedFeatures.set(featureProvider.clientFeatureProps.featureKey, feature);
    loaded++;
  }
  return resolvedFeatures;
}
//# sourceMappingURL=loader.js.map