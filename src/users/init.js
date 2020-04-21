const mongoose = require('mongoose');
const passport = require('passport');
const AnonymousStrategy = require('passport-anonymous');
const passportLocalMongoose = require('passport-local-mongoose');
const jwtStrategy = require('./strategies/jwt');
const apiKeyStrategy = require('./strategies/apiKey');
const authRoutes = require('./routes');
const buildCollectionSchema = require('../collections/buildSchema');
const baseUserFields = require('./baseFields');
const sanitize = require('./sanitize');

function initUser() {
  this.config.user.fields.push(...baseUserFields);
  this.config.user = sanitize(this.config.user);
  const userSchema = buildCollectionSchema(this.config.user, this.config);
  userSchema.plugin(passportLocalMongoose, { usernameField: this.config.user.auth.useAsUsername });

  this.User = {
    config: this.config.user,
    Model: mongoose.model(this.config.user.labels.singular, userSchema),
  };

  passport.use(this.User.Model.createStrategy());
  passport.use(apiKeyStrategy(this.User));
  passport.use(jwtStrategy(this.User));
  passport.serializeUser(this.User.Model.serializeUser());
  passport.deserializeUser(this.User.Model.deserializeUser());
  passport.use(new AnonymousStrategy.Strategy());

  this.router.use(authRoutes(this.User.Model, this.config, this.sendEmail));
}

module.exports = initUser;
