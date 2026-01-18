export const createClientFeature = feature => {
  const featureProviderProvideClient = props => {
    const featureProviderClient = {
      clientFeatureProps: props
    };
    if (typeof feature === 'function') {
      featureProviderClient.feature = ({
        config,
        featureClientImportMap,
        featureClientSchemaMap,
        featureProviderMap,
        field,
        resolvedFeatures,
        schemaPath,
        unSanitizedEditorConfig
      }) => {
        const toReturn = feature({
          config,
          featureClientImportMap,
          featureClientSchemaMap,
          featureProviderMap,
          field,
          props,
          resolvedFeatures,
          schemaPath,
          unSanitizedEditorConfig
        });
        if (toReturn.sanitizedClientFeatureProps === null) {
          toReturn.sanitizedClientFeatureProps = props;
        }
        return toReturn;
      };
    } else {
      // We have to spread feature here! Otherwise, if the arg of createClientFeature is not a function, and 2
      // richText editors have the same feature (even if both call it, e.g. both call UploadFeature()),
      // the second richText editor here will override sanitizedClientFeatureProps of the first feature, as both richText
      // editor features share the same reference to the feature object.
      // Example: richText editor 1 and 2 both have UploadFeature. richText editor 1 calls UploadFeature() with custom fields,
      // richText editor 2 calls UploadFeature() with NO custom fields. If we don't spread feature here, richText editor 1
      // will not have any custom fields, as richText editor 2 will override the feature object.
      const newFeature = {
        ...feature
      };
      newFeature.sanitizedClientFeatureProps = props;
      featureProviderClient.feature = newFeature;
    }
    return featureProviderClient;
  };
  return featureProviderProvideClient;
};
//# sourceMappingURL=createClientFeature.js.map