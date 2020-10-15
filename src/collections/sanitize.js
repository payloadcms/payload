const merge = require('deepmerge');
const { DuplicateCollection, MissingCollectionLabel } = require('../errors');
const sanitizeFields = require('../fields/sanitize');
const toKebabCase = require('../utilities/toKebabCase');
const baseAuthFields = require('../auth/baseFields');
const baseAPIKeyFields = require('../auth/baseAPIKeyFields');

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
    let uploadFields = [
      {
        name: 'filename',
        label: 'Filename',
        hooks: {
          beforeChange: [
            ({ req, operation, value }) => {
              if (operation === 'create') {
                const file = (req.files && req.files.file) ? req.files.file : req.file;
                return file.name;
              }

              return value;
            },
          ],
        },
        type: 'text',
        required: true,
        unique: true,
        admin: {
          disabled: true,
          readOnly: true,
        },
      }, {
        name: 'mimeType',
        label: 'MIME Type',
        type: 'text',
        admin: {
          readOnly: true,
          disabled: true,
        },
      }, {
        name: 'filesize',
        label: 'File Size',
        type: 'number',
        admin: {
          readOnly: true,
          disabled: true,
        },
      },
    ];

    if (collection.upload.imageSizes && Array.isArray(collection.upload.imageSizes)) {
      uploadFields = uploadFields.concat([
        {
          name: 'width',
          label: 'Width',
          type: 'number',
          admin: {
            readOnly: true,
            disabled: true,
          },
        }, {
          name: 'height',
          label: 'Height',
          type: 'number',
          admin: {
            readOnly: true,
            disabled: true,
          },
        },
        {
          name: 'sizes',
          label: 'Sizes',
          type: 'group',
          admin: {
            disabled: true,
          },
          fields: collection.upload.imageSizes.map((size) => ({
            label: size.name,
            name: size.name,
            type: 'group',
            admin: {
              disabled: true,
            },
            fields: [
              {
                name: 'width',
                label: 'Width',
                type: 'number',
                admin: {
                  readOnly: true,
                  disabled: true,
                },
              }, {
                name: 'height',
                label: 'Height',
                type: 'number',
                admin: {
                  readOnly: true,
                  disabled: true,
                },
              }, {
                name: 'mimeType',
                label: 'MIME Type',
                type: 'text',
                admin: {
                  readOnly: true,
                  disabled: true,
                },
              }, {
                name: 'filesize',
                label: 'File Size',
                type: 'number',
                admin: {
                  readOnly: true,
                  disabled: true,
                },
              }, {
                name: 'filename',
                label: 'File Name',
                type: 'text',
                admin: {
                  readOnly: true,
                  disabled: true,
                },
              },
            ],
          })),
        },
      ]);
    }

    uploadFields = mergeBaseFields(sanitized.fields, uploadFields);

    sanitized.fields = [
      ...uploadFields,
      ...sanitized.fields,
    ];
  }

  if (collection.auth) {
    if (!sanitized.hooks.beforeLogin) sanitized.hooks.beforeLogin = [];
    if (!sanitized.hooks.afterLogin) sanitized.hooks.afterLogin = [];
    if (!collection.auth.forgotPassword) sanitized.auth.forgotPassword = {};
    if (!collection.auth.verify) sanitized.auth.verify = {};

    let authFields = baseAuthFields;

    if (collection.auth.useAPIKey) {
      authFields = authFields.concat(baseAPIKeyFields);
    }

    if (collection.auth.emailVerification) {
      authFields.push({
        name: '_verified',
        type: 'checkbox',
        access: {
          create: () => false,
          update: ({ req: { user } }) => Boolean(user),
          read: ({ req: { user } }) => Boolean(user),
        },
        admin: {
          disabled: true,
        },
      });

      authFields.push({
        name: '_verificationToken',
        type: 'text',
        hidden: true,
      });
    }

    sanitized.auth.maxLoginAttempts = typeof sanitized.auth.maxLoginAttempts === 'undefined' ? 5 : sanitized.auth.maxLoginAttempts;
    sanitized.auth.lockTime = sanitized.auth.lockTime || 600000; // 10 minutes

    if (sanitized.auth.maxLoginAttempts > 0) {
      authFields.push({
        name: 'loginAttempts',
        type: 'number',
        hidden: true,
        defaultValue: 0,
      });

      authFields.push({
        name: 'lockUntil',
        type: 'date',
        hidden: true,
      });

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
