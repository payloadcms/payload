import merge from 'deepmerge';
import { fieldAffectsData } from '../../fields/config/types';
import { SanitizedCollectionConfig, CollectionConfig } from './types';
import sanitizeFields from '../../fields/config/sanitize';
import toKebabCase from '../../utilities/toKebabCase';
import baseAuthFields from '../../fields/baseFields/baseAuthFields';
import baseAPIKeyFields from '../../fields/baseFields/baseAPIKeyFields';
import baseVerificationFields from '../../fields/baseFields/baseVerificationFields';
import baseAccountLockFields from '../../fields/baseFields/baseAccountLockFields';
import getBaseUploadFields from '../../fields/baseFields/getBaseUploadFields';
import { formatLabels } from '../../utilities/formatLabels';
import { defaults, authDefaults } from './defaults';
import { Config } from '../../config/types';

const mergeBaseFields = (fields, baseFields) => {
  const mergedFields = [];

  if (fields) {
    baseFields.forEach((baseField) => {
      let matchedIndex = null;

      const match = fields.find((field, i) => {
        if (field.name === baseField.name) {
          matchedIndex = i;
          return true;
        }

        return false;
      });

      if (match) {
        const matchCopy = { ...match };
        fields.splice(matchedIndex, 1);

        let mergedField = {
          ...baseField,
          ...matchCopy,
        };

        if (baseField.fields && matchCopy.fields) {
          mergedField.fields = mergeBaseFields(matchCopy.fields, baseField.fields);
          return mergedFields.push(mergedField);
        }

        mergedField = merge(mergedField, matchCopy, { arrayMerge: (_, source) => source });
        return mergedFields.push(mergedField);
      }

      return mergedFields.push(baseField);
    });

    return mergedFields;
  }

  return baseFields;
};

const sanitizeCollection = (config: Config, collection: CollectionConfig): SanitizedCollectionConfig => {
  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized: CollectionConfig = merge(defaults, collection);

  sanitized.slug = toKebabCase(sanitized.slug);
  sanitized.labels = sanitized.labels || formatLabels(sanitized.slug);

  if (sanitized.revisions) {
    if (sanitized.revisions === true) sanitized.revisions = {};
  }

  if (sanitized.upload) {
    if (sanitized.upload === true) sanitized.upload = {};

    sanitized.upload.staticDir = sanitized.upload.staticDir || sanitized.slug;
    sanitized.upload.staticURL = sanitized.upload.staticURL || `/${sanitized.slug}`;
    sanitized.admin.useAsTitle = (sanitized.admin.useAsTitle && sanitized.admin.useAsTitle !== 'id') ? sanitized.admin.useAsTitle : 'filename';

    let uploadFields = getBaseUploadFields({
      config,
      collection: sanitized,
    });

    uploadFields = mergeBaseFields(sanitized.fields, uploadFields);

    sanitized.fields = [
      ...uploadFields,
      ...sanitized.fields,
    ];
  }

  if (sanitized.auth) {
    sanitized.auth = merge(authDefaults, typeof sanitized.auth === 'object' ? sanitized.auth : {});

    let authFields = baseAuthFields;

    if (sanitized.auth.useAPIKey) {
      authFields = authFields.concat(baseAPIKeyFields);
    }

    if (sanitized.auth.verify) {
      if (sanitized.auth.verify === true) sanitized.auth.verify = {};
      authFields = authFields.concat(baseVerificationFields);
    }

    if (sanitized.auth.maxLoginAttempts > 0) {
      authFields = authFields.concat(baseAccountLockFields);
    }

    authFields = mergeBaseFields(sanitized.fields, authFields);

    sanitized.fields = [
      ...authFields,
      ...sanitized.fields,
    ];
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  const validRelationships = config.collections.map((c) => c.slug);
  sanitized.fields = sanitizeFields(sanitized.fields, validRelationships);

  return sanitized as SanitizedCollectionConfig;
};

export default sanitizeCollection;
