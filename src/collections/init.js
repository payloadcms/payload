const mongoose = require('mongoose');
const mongooseHidden = require('mongoose-hidden')({
  hidden: {
    salt: true, hash: true, _id: true, __v: true,
  },
  applyRecursively: true,
});
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy;
const jwtStrategy = require('../auth/strategies/jwt');
const apiKeyStrategy = require('../auth/strategies/apiKey');
const collectionRoutes = require('./routes');
const buildSchema = require('./buildSchema');
const sanitize = require('./sanitize');
const baseAuthFields = require('../auth/baseFields');
const authRoutes = require('../auth/routes');

function registerCollections() {
  this.config.collections = this.config.collections.map((collection) => {
    let formattedCollection = collection;

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

    if (collection.auth) {
      formattedCollection.fields = [
        ...baseAuthFields,
        ...formattedCollection.fields,
      ];
    }

    formattedCollection = sanitize(this.collections, formattedCollection);

    const schema = buildSchema(formattedCollection, this.config);

    if (collection.auth) {
      schema.plugin(passportLocalMongoose, { usernameField: 'email' });
    }

    schema.plugin(mongooseHidden);

    this.collections[formattedCollection.slug] = {
      Model: mongoose.model(formattedCollection.slug, schema),
      config: formattedCollection,
    };

    if (collection.auth) {
      const AuthCollection = this.collections[formattedCollection.slug];

      passport.use(new LocalStrategy(AuthCollection.Model.authenticate()));
      passport.use(`${AuthCollection.config.slug}-api-key`, apiKeyStrategy(AuthCollection));
      passport.use(`${AuthCollection.config.slug}-jwt`, jwtStrategy(this.config, AuthCollection));
      passport.serializeUser(AuthCollection.Model.serializeUser());
      passport.deserializeUser(AuthCollection.Model.deserializeUser());

      this.router.use(authRoutes(AuthCollection, this.config, this.sendEmail));
    } else {
      this.router.use(collectionRoutes(this.collections[formattedCollection.slug]));
    }

    return formattedCollection;
  });
}

module.exports = registerCollections;
