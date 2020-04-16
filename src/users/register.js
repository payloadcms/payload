const mongoose = require('mongoose');
const passport = require('passport');
const AnonymousStrategy = require('passport-anonymous');
const passportLocalMongoose = require('passport-local-mongoose');
const jwtStrategy = require('./jwt');
const authRoutes = require('./routes');
const buildCollectionSchema = require('../collections/buildSchema');
const baseUserFields = require('./baseFields');
const collectionRoutes = require('../collections/routes');

function registerUser() {
  this.config.user.fields.push(...baseUserFields);
  const userSchema = buildCollectionSchema(this.config.user, this.config);
  userSchema.plugin(passportLocalMongoose, { usernameField: this.config.user.auth.useAsUsername });
  this.User = {
    config: this.config.user,
    Model: mongoose.model(this.config.user.labels.singular, userSchema),
  };

  passport.use(this.User.Model.createStrategy());
  passport.use(jwtStrategy(this.User.Model, this.config));
  passport.serializeUser(this.User.Model.serializeUser());
  passport.deserializeUser(this.User.Model.deserializeUser());
  passport.use(new AnonymousStrategy.Strategy());

  this.router.use(authRoutes(this.User.Model, this.config, this.email));

  this.router.use(collectionRoutes(this.User));
}

module.exports = registerUser;
