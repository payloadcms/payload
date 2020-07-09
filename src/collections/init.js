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
const apiKeyStrategy = require('../auth/strategies/apiKey');
const collectionRoutes = require('./routes');
const buildSchema = require('./buildSchema');
const authRoutes = require('../auth/routes');

function registerCollections() {
  this.config.collections = this.config.collections.map((collection) => {
    const formattedCollection = collection;

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

      if (collection.auth.useAPIKey) {
        passport.use(`${AuthCollection.config.slug}-api-key`, apiKeyStrategy(AuthCollection));
      }

      this.router.use(authRoutes(AuthCollection, this.config, this.sendEmail));
    } else {
      this.router.use(collectionRoutes(this.collections[formattedCollection.slug]));
    }

    return formattedCollection;
  });
}

module.exports = registerCollections;
