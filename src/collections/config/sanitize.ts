import merge from 'deepmerge';
import { Collection } from './types';
import sanitizeFields from '../../fields/config/sanitize';
import toKebabCase from '../../utilities/toKebabCase';
import baseAuthFields from '../../fields/baseFields/baseFields';
import baseAPIKeyFields from '../../fields/baseFields/baseAPIKeyFields';
import baseVerificationFields from '../../fields/baseFields/baseVerificationFields';
import baseAccountLockFields from '../../fields/baseFields/baseAccountLockFields';
import baseUploadFields from '../../fields/baseFields/baseUploadFields';
import baseImageUploadFields from '../../fields/baseFields/baseImageUploadFields';
import formatLabels from '../../utilities/formatLabels';

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

const sanitizeCollection = (collections: Collection[], collection: Collection): Collection => {
  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized: Collection = { ...collection };
  sanitized.slug = toKebabCase(sanitized.slug);
  sanitized.labels = !sanitized.labels ? formatLabels(sanitized.slug) : sanitized.labels;

  // /////////////////////////////////
  // Ensure that collection has required object structure
  // /////////////////////////////////

  if (!sanitized.hooks) sanitized.hooks = {};
  if (!sanitized.access) sanitized.access = {};
  if (!sanitized.admin) sanitized.admin = {};

  if (!sanitized.hooks.beforeOperation) sanitized.hooks.beforeOperation = [];
  if (!sanitized.hooks.beforeValidate) sanitized.hooks.beforeValidate = [];
  if (!sanitized.hooks.beforeChange) sanitized.hooks.beforeChange = [];
  if (!sanitized.hooks.afterChange) sanitized.hooks.afterChange = [];
  if (!sanitized.hooks.beforeRead) sanitized.hooks.beforeRead = [];
  if (!sanitized.hooks.afterRead) sanitized.hooks.afterRead = [];
  if (!sanitized.hooks.beforeDelete) sanitized.hooks.beforeDelete = [];
  if (!sanitized.hooks.afterDelete) sanitized.hooks.afterDelete = [];


  if (sanitized.upload) {
    if (!sanitized.upload.staticDir) sanitized.upload.staticDir = sanitized.slug;
    if (!sanitized.upload.staticURL) sanitized.upload.staticURL = `/${sanitized.slug}`;
    if (!sanitized.admin.useAsTitle) sanitized.admin.useAsTitle = 'filename';
  }

  // /////////////////////////////////
  // Add required base fields
  // /////////////////////////////////

  if (collection.upload) {
    let uploadFields = baseUploadFields;

    if (collection.upload.imageSizes && Array.isArray(collection.upload.imageSizes)) {
      uploadFields = uploadFields.concat(baseImageUploadFields(collection.upload.imageSizes));
    }

    uploadFields = mergeBaseFields(sanitized.fields, uploadFields);

    sanitized.fields = [
      ...uploadFields,
      ...sanitized.fields,
    ];
  }

  if (collection.auth) {
    if (collection.auth === true) sanitized.auth = {};
    if (!sanitized.hooks.beforeLogin) sanitized.hooks.beforeLogin = [];
    if (!sanitized.hooks.afterLogin) sanitized.hooks.afterLogin = [];
    if (!sanitized.hooks.afterForgotPassword) sanitized.hooks.afterForgotPassword = [];
    if (!collection.auth.forgotPassword) sanitized.auth.forgotPassword = {};

    let authFields = baseAuthFields;

    if (collection.auth.useAPIKey) {
      authFields = authFields.concat(baseAPIKeyFields);
    }

    if (collection.auth.verify) {
      authFields = authFields.concat(baseVerificationFields);
    }

    sanitized.auth.maxLoginAttempts = typeof sanitized.auth.maxLoginAttempts === 'undefined' ? 5 : sanitized.auth.maxLoginAttempts;
    sanitized.auth.lockTime = sanitized.auth.lockTime || 600000; // 10 minutes

    if (sanitized.auth.maxLoginAttempts > 0) {
      authFields = authFields.concat(baseAccountLockFields);

      if (!sanitized.access.unlock) sanitized.access.unlock = ({ req: { user } }) => Boolean(user);
    }

    if (!sanitized.auth.tokenExpiration) sanitized.auth.tokenExpiration = 7200;

    if (!sanitized.auth.cookies) sanitized.auth.cookies = {};

    if (typeof sanitized.auth.cookies !== 'boolean') {
      if (!sanitized.auth.cookies.secure) sanitized.auth.cookies.secure = false;
      if (!sanitized.auth.cookies.sameSite) sanitized.auth.cookies.sameSite = 'Lax';
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

  const validRelationships = collections.map((c) => c.slug);
  sanitized.fields = sanitizeFields(sanitized.fields, validRelationships);

  return sanitized;
};

export default sanitizeCollection;
