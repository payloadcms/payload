const mongoose = require('mongoose');
const collectionRoutes = require('./routes');
const buildSchema = require('./buildSchema');
const sanitize = require('./sanitize');

function registerCollections() {
  this.config.collections.forEach((collection) => {
    const formattedCollection = { ...collection };

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
            fields: collection.upload.imageSizes.map(size => ({
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

      formattedCollection.fields = [
        ...formattedCollection.fields,
        ...uploadFields,
      ];
    }

    const schema = buildSchema(formattedCollection, this.config);

    this.collections[formattedCollection.slug] = {
      Model: mongoose.model(formattedCollection.slug, schema),
      config: sanitize(this.collections, formattedCollection),
    };

    this.router.use(collectionRoutes(this.collections[formattedCollection.slug]));
  });
}

module.exports = registerCollections;
