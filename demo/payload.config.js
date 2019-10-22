const collections = require('./collections');
const globals = require('./globals');
const contentBlocks = require('./content-blocks');

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
  collections: collections,
  globals: globals,
  contentBlocks: contentBlocks,
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
