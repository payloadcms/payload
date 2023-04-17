import merge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';
import { SanitizedCollectionConfig, CollectionConfig } from './types';
import sanitizeFields from '../../fields/config/sanitize';
import baseAuthFields from '../../auth/baseFields/auth';
import baseAPIKeyFields from '../../auth/baseFields/apiKey';
import baseVerificationFields from '../../auth/baseFields/verification';
import baseAccountLockFields from '../../auth/baseFields/accountLock';
import getBaseUploadFields from '../../uploads/getBaseFields';
import { formatLabels } from '../../utilities/formatLabels';
import { defaults, authDefaults } from './defaults';
import { Config } from '../../config/types';
import baseVersionFields from '../../versions/baseFields';
import TimestampsRequired from '../../errors/TimestampsRequired';
import mergeBaseFields from '../../fields/mergeBaseFields';

const sanitizeCollection = (config: Config, collection: CollectionConfig): SanitizedCollectionConfig => {
  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized: CollectionConfig = merge(defaults, collection, {
    isMergeableObject: isPlainObject,
  });

  sanitized.labels = sanitized.labels || formatLabels(sanitized.slug);

  if (sanitized.versions) {
    if (sanitized.versions === true) sanitized.versions = { drafts: false };

    if (sanitized.timestamps === false) {
      throw new TimestampsRequired(collection);
    }

    if (sanitized.versions.drafts) {
      if (sanitized.versions.drafts === true) {
        sanitized.versions.drafts = {
          autosave: false,
        };
      }

      if (sanitized.versions.drafts.autosave === true) {
        sanitized.versions.drafts.autosave = {
          interval: 2000,
        };
      }

      sanitized.fields = mergeBaseFields(sanitized.fields, baseVersionFields);
    }
  }

  if (sanitized.upload) {
    if (sanitized.upload === true) sanitized.upload = {};

    sanitized.upload.staticDir = sanitized.upload.staticDir || sanitized.slug;
    sanitized.upload.staticURL = sanitized.upload.staticURL || `/${sanitized.slug}`;
    sanitized.admin.useAsTitle = (sanitized.admin.useAsTitle && sanitized.admin.useAsTitle !== 'id') ? sanitized.admin.useAsTitle : 'filename';

    const uploadFields = getBaseUploadFields({
      config,
      collection: sanitized,
    });

    sanitized.fields = mergeBaseFields(sanitized.fields, uploadFields);
  }

  if (sanitized.auth) {
    sanitized.auth = merge(
      authDefaults,
      typeof sanitized.auth === 'object' ? sanitized.auth : {},
      {
        isMergeableObject: isPlainObject,
      },
    );

    let authFields = [];

    if (sanitized.auth.useAPIKey) {
      authFields = authFields.concat(baseAPIKeyFields);
    }

    if (!sanitized.auth.disableLocalStrategy) {
      authFields = authFields.concat(baseAuthFields);

      if (sanitized.auth.verify) {
        if (sanitized.auth.verify === true) sanitized.auth.verify = {};
        authFields = authFields.concat(baseVerificationFields);
      }

      if (sanitized.auth.maxLoginAttempts > 0) {
        authFields = authFields.concat(baseAccountLockFields);
      }
    }

    sanitized.fields = mergeBaseFields(sanitized.fields, authFields);
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  const validRelationships = config.collections.map((c) => c.slug);
  sanitized.fields = sanitizeFields(sanitized.fields, validRelationships);

  return sanitized as SanitizedCollectionConfig;
};

export default sanitizeCollection;
