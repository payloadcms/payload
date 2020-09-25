const mongoose = require('mongoose');
const express = require('express');
const mongooseHidden = require('mongoose-hidden')({
  hidden: {
    _id: true, __v: true,
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
      schema.plugin(passportLocalMongoose, {
        usernameField: 'email',
      });

      // Check if collection is the admin user set in config
      if (collection.slug === this.config.admin.user) {
        schema.add({ loginAttempts: { type: Number, hide: true, default: 0 } });
        schema.add({ lockUntil: { type: Date, hide: true } });

        schema.virtual('isLocked').get(() => !!(this.lockUntil && this.lockUntil > Date.now()));

        const { maxLoginAttempts, lockTime } = this.config.admin;

        // eslint-disable-next-line func-names
        schema.methods.incLoginAttempts = function (cb) {
          // Expired lock, restart count at 1
          if (this.lockUntil && this.lockUntil < Date.now()) {
            return this.updateOne({
              $set: { loginAttempts: 1 },
              $unset: { lockUntil: 1 },
            }, cb);
          }

          const updates = { $inc: { loginAttempts: 1 } };
          // Lock the account if at max attempts and not already locked
          if (this.loginAttempts + 1 >= maxLoginAttempts && !this.isLocked) {
            updates.$set = { lockUntil: Date.now() + lockTime };
          }
          return this.updateOne(updates, cb);
        };

        // eslint-disable-next-line func-names
        schema.methods.resetLoginAttempts = function (cb) {
          return this.updateOne({
            $set: { loginAttempts: 0 },
            $unset: { lockUntil: 1 },
          }, cb);
        };
      }

      schema.path('hash').options.hide = true;
      schema.path('salt').options.hide = true;
      if (collection.auth.emailVerification) {
        schema.add({ _verificationToken: { type: String, hide: true } });
      }
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
        registerFirstUser,
        forgotPassword,
        resetPassword,
        verifyEmail,
      } = this.requestHandlers.collections.auth;

      if (collection.auth.emailVerification) {
        router
          .route(`/${slug}/verify/:token`)
          .post(verifyEmail);
      }

      router
        .route(`/${slug}/init`)
        .get(init);

      router
        .route(`/${slug}/login`)
        .post(login);

      router
        .route(`/${slug}/logout`)
        .post(logout);

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
    }

    router.route(`/${slug}`)
      .get(find)
      .post(create);

    router.route(`/${slug}/:id`)
      .put(update)
      .get(findByID)
      .delete(deleteHandler);

    this.router.use(router);

    return formattedCollection;
  });
}

module.exports = registerCollections;
