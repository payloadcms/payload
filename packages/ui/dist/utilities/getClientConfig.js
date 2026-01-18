import { createClientConfig, createUnauthenticatedClientConfig } from 'payload';
import { cache } from 'react';
let cachedClientConfigs = global._payload_clientConfigs;
if (!cachedClientConfigs) {
  cachedClientConfigs = global._payload_clientConfigs = {};
}
export const getClientConfig = cache(({
  config,
  i18n,
  importMap,
  user
}) => {
  const currentLanguage = i18n.language;
  if (cachedClientConfigs[currentLanguage] && !global._payload_doNotCacheClientConfig) {
    if (!user) {
      return createUnauthenticatedClientConfig({
        clientConfig: cachedClientConfigs[currentLanguage]
      });
    }
    return cachedClientConfigs[currentLanguage];
  }
  const cachedClientConfig = createClientConfig({
    config,
    i18n,
    importMap,
    user
  });
  cachedClientConfigs[currentLanguage] = cachedClientConfig;
  global._payload_clientConfigs = cachedClientConfigs;
  global._payload_doNotCacheClientConfig = false;
  if (!user) {
    return createUnauthenticatedClientConfig({
      clientConfig: cachedClientConfig
    });
  }
  return cachedClientConfig;
});
//# sourceMappingURL=getClientConfig.js.map