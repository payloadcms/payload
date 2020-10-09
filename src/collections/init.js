const mongoose = require('mongoose');
const express = require('express');
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


      const { maxLoginAttempts, lockTime } = collection.auth;

      if (maxLoginAttempts > 0) {
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
    }

    this.collections[formattedCollection.slug] = {
      Model: mongoose.model(formattedCollection.slug, schema),
      config: formattedCollection,
    };

    // If not local, open routes
    if (!this.config.local) {
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
          unlock,
        } = this.requestHandlers.collections.auth;

        if (collection.auth.emailVerification) {
          router
            .route(`/${slug}/verify/:token`)
            .post(verifyEmail);
        }

        if (collection.auth.maxLoginAttempts > 0) {
          router
            .route(`/${slug}/unlock`)
            .post(unlock);
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
    }

    return formattedCollection;
  });
}

module.exports = registerCollections;
