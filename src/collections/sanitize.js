const { DuplicateCollection, MissingCollectionLabel } = require('../errors');
const sanitizeFields = require('../fields/sanitize');
const toKebabCase = require('../utilities/toKebabCase');
const baseAuthFields = require('../auth/baseFields');
const baseAPIKeyFields = require('../auth/baseAPIKeyFields');

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
      }, {
        name: 'mimeType',
        label: 'MIME Type',
        type: 'text',
        readOnly: true,
      }, {
        name: 'filesize',
        label: 'File Size',
        type: 'number',
        readOnly: true,
      },
    ];

    if (collection.upload.imageSizes && Array.isArray(collection.upload.imageSizes)) {
      uploadFields = uploadFields.concat([
        {
          name: 'width',
          label: 'Width',
          type: 'number',
          readOnly: true,
        }, {
          name: 'height',
          label: 'Height',
          type: 'number',
          readOnly: true,
        },
        {
          name: 'sizes',
          label: 'Sizes',
          type: 'group',
          fields: collection.upload.imageSizes.map((size) => ({
            label: size.name,
            name: size.name,
            type: 'group',
            fields: [
              {
                name: 'width',
                label: 'Width',
                type: 'number',
                readOnly: true,
              }, {
                name: 'height',
                label: 'Height',
                type: 'number',
                readOnly: true,
              }, {
                name: 'mimeType',
                label: 'MIME Type',
                type: 'text',
                readOnly: true,
              }, {
                name: 'filesize',
                label: 'File Size',
                type: 'number',
                readOnly: true,
              }, {
                name: 'filename',
                label: 'File Name',
                type: 'text',
                readOnly: true,
              },
            ],
          })),
        },
      ]);
    }

    sanitizedCollection.fields = [
      ...sanitizedCollection.fields,
      ...uploadFields,
    ];
  }

  if (collection.auth) {
    sanitizedCollection.fields = [
      ...baseAuthFields,
      ...sanitizedCollection.fields,
    ];

    if (collection.auth.useAPIKey) {
      sanitizedCollection.fields = [
        ...sanitizedCollection.fields,
        ...baseAPIKeyFields,
      ];
    }
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  sanitizedCollection.fields = sanitizeFields(collection.fields);

  return sanitizedCollection;
};

module.exports = sanitizeCollection;
