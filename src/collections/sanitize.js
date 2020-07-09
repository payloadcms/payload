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

  const sanitizedCollection = { ...collection };

  sanitizedCollection.slug = toKebabCase(sanitizedCollection.slug);

  // /////////////////////////////////
  // Ensure that collection has required object structure
  // /////////////////////////////////

  if (!sanitizedCollection.hooks) sanitizedCollection.hooks = {};
  if (!sanitizedCollection.access) sanitizedCollection.access = {};

  if (sanitizedCollection.upload) {
    if (!sanitizedCollection.upload.staticDir) sanitizedCollection.upload.staticDir = sanitizedCollection.slug;
    if (!sanitizedCollection.upload.staticURL) sanitizedCollection.upload.staticURL = sanitizedCollection.slug;
    if (!sanitizedCollection.useAsTitle) sanitizedCollection.useAsTitle = 'filename';
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
        readOnly: true,
        admin: {
          disable: true,
        },
      }, {
        name: 'mimeType',
        label: 'MIME Type',
        type: 'text',
        readOnly: true,
        admin: {
          disable: true,
        },
      }, {
        name: 'filesize',
        label: 'File Size',
        type: 'number',
        readOnly: true,
        admin: {
          disable: true,
        },
      },
    ];

    if (collection.upload.imageSizes && Array.isArray(collection.upload.imageSizes)) {
      uploadFields = uploadFields.concat([
        {
          name: 'width',
          label: 'Width',
          type: 'number',
          readOnly: true,
          admin: {
            disable: true,
          },
        }, {
          name: 'height',
          label: 'Height',
          type: 'number',
          readOnly: true,
          admin: {
            disable: true,
          },
        },
        {
          name: 'sizes',
          label: 'Sizes',
          type: 'group',
          admin: {
            disable: true,
          },
          fields: collection.upload.imageSizes.map((size) => ({
            label: size.name,
            name: size.name,
            type: 'group',
            admin: {
              disable: true,
            },
            fields: [
              {
                name: 'width',
                label: 'Width',
                type: 'number',
                readOnly: true,
                admin: {
                  disable: true,
                },
              }, {
                name: 'height',
                label: 'Height',
                type: 'number',
                readOnly: true,
                admin: {
                  disable: true,
                },
              }, {
                name: 'mimeType',
                label: 'MIME Type',
                type: 'text',
                readOnly: true,
                admin: {
                  disable: true,
                },
              }, {
                name: 'filesize',
                label: 'File Size',
                type: 'number',
                readOnly: true,
                admin: {
                  disable: true,
                },
              }, {
                name: 'filename',
                label: 'File Name',
                type: 'text',
                readOnly: true,
                admin: {
                  disable: true,
                },
              },
            ],
          })),
        },
      ]);
    }

    uploadFields = mergeBaseFields(sanitizedCollection.fields, uploadFields);

    sanitizedCollection.fields = [
      ...uploadFields,
      ...sanitizedCollection.fields,
    ];
  }

  if (collection.auth) {
    let authFields = baseAuthFields;

    if (collection.auth.useAPIKey) {
      authFields = authFields.concat(baseAPIKeyFields);
    }

    authFields = mergeBaseFields(sanitizedCollection.fields, authFields);

    sanitizedCollection.fields = [
      ...authFields,
      ...sanitizedCollection.fields,
    ];
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  sanitizedCollection.fields = sanitizeFields(sanitizedCollection.fields);

  return sanitizedCollection;
};

module.exports = sanitizeCollection;
