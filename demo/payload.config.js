const path = require('path');
const Page = require('./collections/Page');
const Category = require('./collections/Category');
const User = require('./collections/User');
const Upload = require('./collections/Upload');
const Header = require('./globals/Header');
const Footer = require('./globals/Footer');

module.exports = {
  // disableAdmin: true,
  collections: [Page, Category],
  user: User,
  upload: Upload,
  globals: [Header, Footer],
  port: 3000,
  serverUrl: 'http://localhost:3000',
  cors: ['http://localhost', 'http://localhost:8080', 'http://localhost:8081'],
  adminURL: '/payload-login',
  routes: {
    api: '/api',
    admin: '/admin',
  },
  plugins: [],
  compression: {},
  paths: {
    scssOverrides: path.resolve(__dirname, 'client/scss/overrides.scss'),
    config: path.resolve(__dirname, 'payload.config.js'),
  },
  mongoURL: 'mongodb://localhost/payload',
  localization: {
    locales: [
      'en',
      'es',
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  uploads: {
    image: {
      imageSizes: [
        {
          name: 'tablet',
          width: 640,
          height: 480,
          crop: 'left top', // would it make sense for this to be set by the uploader?
        },
        {
          name: 'mobile',
          width: 320,
          height: 240,
          crop: 'left top',
        },
        { // Is the icon size required for the admin dashboard to work?
          name: 'icon',
          width: 16,
          height: 16,
        },
      ],
    },
    profile: {
      imageSizes: [
        {
          name: 'full',
          width: 640,
          height: 480,
          crop: 'center',
        },
      ],
    },
  },
  staticUrl: '/uploads',
  staticDir: 'demo/upload',
  email: {
    provider: 'mock',
  },
  graphQL: {
    path: '/graphql',
    graphiql: true,
  },
};
