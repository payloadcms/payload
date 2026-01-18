import { getBaseFields } from './baseFields.js';
/**
 * This function is run to enrich the basefields which every link has with potential, custom user-added fields.
 */
export function transformExtraFields(customFieldSchema, config, enabledCollections, disabledCollections, maxDepth) {
  const baseFields = getBaseFields(config, enabledCollections, disabledCollections, maxDepth);
  let fields;
  if (typeof customFieldSchema === 'function') {
    fields = customFieldSchema({
      config,
      defaultFields: baseFields
    });
  } else if (Array.isArray(customFieldSchema)) {
    fields = customFieldSchema;
  } else {
    fields = baseFields;
  }
  return fields;
}
//# sourceMappingURL=transformExtraFields.js.map