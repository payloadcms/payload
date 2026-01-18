import { cache } from 'react';
import { buildFieldSchemaMap } from './buildFieldSchemaMap/index.js';
let cachedSchemaMap = global._payload_schemaMap;
if (!cachedSchemaMap) {
  cachedSchemaMap = global._payload_schemaMap = null;
}
export const getSchemaMap = cache(args => {
  const {
    collectionSlug,
    config,
    globalSlug,
    i18n
  } = args;
  if (!cachedSchemaMap || global._payload_doNotCacheSchemaMap) {
    cachedSchemaMap = new Map();
  }
  let cachedEntityFieldMap = cachedSchemaMap.get(collectionSlug || globalSlug);
  if (cachedEntityFieldMap) {
    return cachedEntityFieldMap;
  }
  cachedEntityFieldMap = new Map();
  const {
    fieldSchemaMap: entityFieldMap
  } = buildFieldSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n: i18n
  });
  cachedSchemaMap.set(collectionSlug || globalSlug, entityFieldMap);
  global._payload_schemaMap = cachedSchemaMap;
  global._payload_doNotCacheSchemaMap = false;
  return entityFieldMap;
});
//# sourceMappingURL=getSchemaMap.js.map