export const getLivePreviewConfig = ({
  collectionConfig,
  config,
  globalConfig,
  isLivePreviewEnabled
}) => ({
  ...(isLivePreviewEnabled ? config.admin.livePreview : {}),
  ...(collectionConfig?.admin?.livePreview || {}),
  ...(globalConfig?.admin?.livePreview || {})
});
/**
 * Multi-level check to determine whether live preview is enabled on a collection or global.
 * For example, live preview can be enabled at both the root config level, or on the entity's config.
 * If a collectionConfig/globalConfig is provided, checks if it is enabled at the root level,
 * or on the entity's own config.
 */
export const isLivePreviewEnabled = ({
  collectionConfig,
  config,
  globalConfig
}) => {
  if (globalConfig) {
    return Boolean(config.admin?.livePreview?.globals?.includes(globalConfig.slug) || globalConfig.admin?.livePreview);
  }
  if (collectionConfig) {
    return Boolean(config.admin?.livePreview?.collections?.includes(collectionConfig.slug) || collectionConfig.admin?.livePreview);
  }
};
/**
 * 1. Looks up the relevant live preview config, which could have been enabled:
 *   a. At the root level, e.g. `collections: ['posts']`
 *   b. On the collection or global config, e.g. `admin: { livePreview: { ... } }`
 * 2. Determines if live preview is enabled, and if not, early returns.
 * 3. Merges the config with the root config, if necessary.
 * 4. Executes the `url` function, if necessary.
 *
 * Notice: internal function only. Subject to change at any time. Use at your own risk.
 */
export const handleLivePreview = async ({
  collectionSlug,
  config,
  data,
  globalSlug,
  operation,
  req
}) => {
  const collectionConfig = collectionSlug ? req.payload.collections[collectionSlug]?.config : undefined;
  const globalConfig = globalSlug ? config.globals.find(g => g.slug === globalSlug) : undefined;
  const enabled = isLivePreviewEnabled({
    collectionConfig,
    config,
    globalConfig
  });
  if (!enabled) {
    return {};
  }
  const livePreviewConfig = getLivePreviewConfig({
    collectionConfig,
    config,
    globalConfig,
    isLivePreviewEnabled: enabled
  });
  let livePreviewURL;
  if (typeof livePreviewConfig?.url === 'string') {
    livePreviewURL = livePreviewConfig.url;
  }
  if (typeof livePreviewConfig?.url === 'function' && operation !== 'create') {
    try {
      const result = await livePreviewConfig.url({
        collectionConfig,
        data,
        globalConfig,
        locale: {
          code: req.locale,
          label: ''
        },
        payload: req.payload,
        req
      });
      if (typeof result === 'string') {
        livePreviewURL = result;
      }
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: `There was an error executing the live preview URL function for ${collectionSlug || globalSlug}`
      });
    }
  }
  return {
    isLivePreviewEnabled: enabled,
    livePreviewConfig,
    livePreviewURL
  };
};
//# sourceMappingURL=handleLivePreview.js.map