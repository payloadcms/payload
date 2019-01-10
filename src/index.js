import mongoose from 'mongoose';
import passport from 'passport';
import express from 'express';
import methodOverride from 'method-override';
import jwtStrategy from './auth/jwt';
import User from '../demo/User/User.model';
import fileUpload from 'express-fileupload';
import assetRoutes from './routes/uploads.routes'

module.exports = {
  init: options => {
    mongoose.connect(options.config.mongoURL, { useNewUrlParser: true }, (err) => {
      if (err) {
        console.log('Unable to connect to the Mongo server. Please start the server. Error:', err);
      } else {
        console.log('Connected to Mongo server successfully!');
      }
    });

    options.app.use(fileUpload());

    // Configure passport for Auth
    options.app.use(passport.initialize());
    options.app.use(passport.session());

    passport.use(options.user.createStrategy());
    passport.use(jwtStrategy(User));
    passport.serializeUser(options.user.serializeUser());
    passport.deserializeUser(options.user.deserializeUser());

    options.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
      res.header('Access-Control-Allow-Headers',
        'Origin X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

      next();
    });

    options.router.use('/upload', assetRoutes);

    options.app.use(express.json());
    options.app.use(methodOverride('X-HTTP-Method-Override'))
    options.app.use(express.urlencoded({ extended: true }));
    options.app.use(options.router);
  }
};
