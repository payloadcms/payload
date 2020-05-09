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
  this.config.User.fields.push(...baseUserFields);
  this.config.User = sanitize(this.config.User);
  const userSchema = buildCollectionSchema(this.config.User, this.config);
  userSchema.plugin(passportLocalMongoose, { usernameField: this.config.User.auth.useAsUsername });

  this.User = {
    config: this.config.User,
    Model: mongoose.model(this.config.User.slug, userSchema),
  };

  passport.use(this.User.Model.createStrategy());
  passport.use(apiKeyStrategy(this.User));
  passport.use(jwtStrategy(this.User));
  passport.serializeUser(this.User.Model.serializeUser());
  passport.deserializeUser(this.User.Model.deserializeUser());
  passport.use(new AnonymousStrategy.Strategy());

  this.router.use(authRoutes(this.User, this.config, this.sendEmail));
}

module.exports = initUser;
