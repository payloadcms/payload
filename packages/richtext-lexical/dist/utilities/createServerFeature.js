export const createServerFeature = ({
  dependencies,
  dependenciesPriority,
  dependenciesSoft,
  feature,
  key
}) => {
  const featureProviderProviderServer = props => {
    const featureProviderServer = {
      dependencies,
      dependenciesPriority,
      dependenciesSoft,
      key,
      serverFeatureProps: props
    };
    if (typeof feature === 'function') {
      featureProviderServer.feature = async ({
        config,
        featureProviderMap,
        isRoot,
        parentIsLocalized,
        resolvedFeatures,
        unSanitizedEditorConfig
      }) => {
        const toReturn = await feature({
          config,
          featureProviderMap,
          isRoot,
          parentIsLocalized,
          props,
          resolvedFeatures,
          unSanitizedEditorConfig
        });
        if (toReturn.sanitizedServerFeatureProps === null) {
          toReturn.sanitizedServerFeatureProps = props;
        }
        return toReturn;
      };
    } else {
      // For explanation why we have to spread feature, see createClientFeature.ts
      const newFeature = {
        ...feature
      };
      newFeature.sanitizedServerFeatureProps = props;
      featureProviderServer.feature = newFeature;
    }
    return featureProviderServer;
  };
  return featureProviderProviderServer;
};
//# sourceMappingURL=createServerFeature.js.map