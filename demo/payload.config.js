const path = require('path');

module.exports = {
  disableAdmin: true,
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
    customComponents: path.resolve(__dirname, 'client/components/custom'),
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
  // uploads: false, // To disable upload routes otherwise defaults will be use and if set to an object
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
