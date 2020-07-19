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

  if (!sanitized.hooks.beforeCreate) sanitized.hooks.beforeCreate = [];
  if (!sanitized.hooks.afterCreate) sanitized.hooks.afterCreate = [];
  if (!sanitized.hooks.beforeUpdate) sanitized.hooks.beforeUpdate = [];
  if (!sanitized.hooks.afterUpdate) sanitized.hooks.afterUpdate = [];
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

    let authFields = baseAuthFields;

    if (collection.auth.useAPIKey) {
      authFields = authFields.concat(baseAPIKeyFields);
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

  sanitized.fields = sanitizeFields(sanitized.fields);

  return sanitized;
};

module.exports = sanitizeCollection;
