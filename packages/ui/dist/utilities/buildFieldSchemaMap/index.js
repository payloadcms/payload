import { confirmPassword, password } from 'payload/shared';
import { traverseFields } from './traverseFields.js';
const baseAuthFields = [{
  name: 'password',
  type: 'text',
  required: true,
  validate: password
}, {
  name: 'confirm-password',
  type: 'text',
  required: true,
  validate: confirmPassword
}];
/**
 * Flattens the config fields into a map of field schemas
 */
export const buildFieldSchemaMap = args => {
  const {
    collectionSlug,
    config,
    globalSlug,
    i18n
  } = args;
  const schemaMap = new Map();
  if (collectionSlug) {
    const matchedCollection = config.collections.find(collection => collection.slug === collectionSlug);
    if (matchedCollection) {
      let fieldsToSet = matchedCollection?.fields || [];
      if (matchedCollection.auth && !matchedCollection.auth.disableLocalStrategy) {
        ;
        baseAuthFields[0].label = i18n.t('general:password');
        baseAuthFields[1].label = i18n.t('authentication:confirmPassword');
        // Place these fields _last_ to ensure they do not disrupt field paths in the field schema map
        fieldsToSet = fieldsToSet.concat(baseAuthFields);
      }
      schemaMap.set(collectionSlug, {
        fields: fieldsToSet
      });
      traverseFields({
        config,
        fields: fieldsToSet,
        i18n,
        parentIndexPath: '',
        parentSchemaPath: collectionSlug,
        schemaMap
      });
    }
  } else if (globalSlug) {
    const matchedGlobal = config.globals.find(global => global.slug === globalSlug);
    if (matchedGlobal) {
      schemaMap.set(globalSlug, {
        fields: matchedGlobal.fields
      });
      traverseFields({
        config,
        fields: matchedGlobal.fields,
        i18n,
        parentIndexPath: '',
        parentSchemaPath: globalSlug,
        schemaMap
      });
    }
  }
  return {
    fieldSchemaMap: schemaMap
  };
};
//# sourceMappingURL=index.js.map