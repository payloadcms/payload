import { defaultEditorConfig } from '../lexical/config/server/default.js';
import { sanitizeServerEditorConfig } from '../lexical/config/server/sanitize.js';
let cachedDefaultSanitizedServerEditorConfig = global._payload_lexical_defaultSanitizedServerEditorConfig;
if (!cachedDefaultSanitizedServerEditorConfig) {
  cachedDefaultSanitizedServerEditorConfig = global._payload_lexical_defaultSanitizedServerEditorConfig = null;
}
export const getDefaultSanitizedEditorConfig = async args => {
  const {
    config,
    parentIsLocalized
  } = args;
  if (cachedDefaultSanitizedServerEditorConfig) {
    return await cachedDefaultSanitizedServerEditorConfig;
  }
  cachedDefaultSanitizedServerEditorConfig = sanitizeServerEditorConfig(defaultEditorConfig, config, parentIsLocalized);
  global.payload_lexical_defaultSanitizedServerEditorConfig = cachedDefaultSanitizedServerEditorConfig;
  cachedDefaultSanitizedServerEditorConfig = await cachedDefaultSanitizedServerEditorConfig;
  global.payload_lexical_defaultSanitizedServerEditorConfig = cachedDefaultSanitizedServerEditorConfig;
  return cachedDefaultSanitizedServerEditorConfig;
};
//# sourceMappingURL=getDefaultSanitizedEditorConfig.js.map