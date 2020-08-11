const mongoose = require('mongoose');
const express = require('express');
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
const buildSchema = require('./buildSchema');
const bindCollectionMiddleware = require('./bindCollection');

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

    const router = express.Router();
    const { slug } = collection;

    router.all(`/${slug}*`, bindCollectionMiddleware(this.collections[formattedCollection.slug]));

    const {
      create,
      find,
      update,
      findByID,
      delete: deleteHandler,
    } = this.requestHandlers.collections;

    if (collection.auth) {
      const AuthCollection = this.collections[formattedCollection.slug];
      passport.use(new LocalStrategy(AuthCollection.Model.authenticate()));

      if (collection.auth.useAPIKey) {
        passport.use(`${AuthCollection.config.slug}-api-key`, apiKeyStrategy(this, AuthCollection));
      }

      const {
        init,
        login,
        logout,
        refresh,
        me,
        register,
        registerFirstUser,
        forgotPassword,
        resetPassword,
        update: authUpdate,
      } = this.requestHandlers.collections.auth;

      router
        .route(`/${slug}/init`)
        .get(init);

      router
        .route(`/${slug}/login`)
        .post(login);

      router
        .route(`/${slug}/logout`)
        .get(logout);

      router
        .route(`/${slug}/refresh-token`)
        .post(refresh);

      router
        .route(`/${slug}/me`)
        .get(me);

      router
        .route(`/${slug}/first-register`)
        .post(registerFirstUser);

      router
        .route(`/${slug}/forgot-password`)
        .post(forgotPassword);

      router
        .route(`/${slug}/reset-password`)
        .post(resetPassword);

      router
        .route(`/${slug}/register`)
        .post(register);

      router.route(`/${slug}`)
        .get(find);

      router.route(`/${slug}/:id`)
        .get(findByID)
        .put(authUpdate)
        .delete(deleteHandler);
    } else {
      router.route(`/${slug}`)
        .get(find)
        .post(create);

      router.route(`/${slug}/:id`)
        .put(update)
        .get(findByID)
        .delete(deleteHandler);
    }

    this.router.use(router);

    return formattedCollection;
  });
}

module.exports = registerCollections;
