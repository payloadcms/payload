const merge = require('deepmerge');
const { DuplicateCollection, MissingCollectionLabel } = require('../errors');
const sanitizeFields = require('../fields/sanitize');
const toKebabCase = require('../utilities/toKebabCase');
const baseAuthFields = require('../fields/baseFields/baseFields');
const baseAPIKeyFields = require('../fields/baseFields/baseAPIKeyFields');
const baseVerificationFields = require('../fields/baseFields/baseVerificationFields');
const baseAccountLockFields = require('../fields/baseFields/baseAccountLockFields');
const baseUploadFields = require('../fields/baseFields/baseUploadFields');
const baseImageUploadFields = require('../fields/baseFields/baseImageUploadFields');

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

const sanitizeCollection = (collections, collection) => {
  // /////////////////////////////////
  // Ensure collection is valid
  // /////////////////////////////////

  if (!collection.labels.singular) {
    throw new MissingCollectionLabel(collection);
  }

  if (collections && collections[collection.labels.singular]) {
    throw new DuplicateCollection(collection);
  }

  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitized = { ...collection };

  sanitized.slug = toKebabCase(sanitized.slug);

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

    if (!sanitized.auth.cookies.secure) sanitized.auth.cookies.secure = false;
    if (!sanitized.auth.cookies.sameSite) sanitized.auth.cookies.sameSite = 'Lax';

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

module.exports = sanitizeCollection;
