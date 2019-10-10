const User = require('./collections/User');
const Page = require('./collections/Page');
const Category = require('./collections/Category');
const Globals = require('./globals');

module.exports = {
  port: 3000,
  serverUrl: 'http://localhost:3000',
  cors: ['http://localhost', 'http://localhost:8080', 'http://localhost:8081'],
  adminURL: '/payload-login',
  routes: {
    api: '/api',
    admin: '/admin'
  },
  mongoURL: 'mongodb://localhost/payload',
  collections: {
    User,
    Page,
    Category,
  },
  globals: Globals,
  roles: [
    'admin',
    'editor',
    'moderator',
    'user',
    'viewer'
  ],
  localization: {
    locales: [
      'en',
      'es'
    ],
    defaultLocale: 'en',
    fallback: true
  },
  staticUrl: '/media',
  staticDir: 'demo/media',
  email: {
    provider: 'mock'
  },
  graphQL: {
    path: '/graphql',
    graphiql: true
  }
};
