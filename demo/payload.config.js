const path = require('path');
const Page = require('./collections/Page');
const Category = require('./collections/Category');
const HookTest = require('./collections/HookTest');
const Post = require('./collections/Post');
const Order = require('./collections/Order');
const Layout = require('./collections/Layout');
const User = require('./collections/User');
const File = require('./collections/File');
const Media = require('./collections/Media');
const Header = require('./globals/Header');
const Footer = require('./globals/Footer');

module.exports = {
  secret: 'SECRET_KEY',
  admin: {
    user: 'users',
    disable: false,
  },
  collections: [
    Page,
    Category,
    Order,
    HookTest,
    Post,
    Layout,
    File,
    Media,
    User,
  ],
  globals: [Header, Footer],
  port: 3000,
  serverURL: 'http://localhost:3000',
  cors: ['http://localhost', 'http://localhost:8080', 'http://localhost:8081'],
  routes: {
    api: '/api',
    admin: '/admin',
    graphQL: '/graphql',
    graphQLPlayground: '/graphql-playground',
  },
  compression: {},
  paths: {
    scss: path.resolve(__dirname, 'client/scss/overrides.scss'),
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
  productionGraphQLPlayground: false,
  email: {
    provider: 'mock',
  },
  components: {
    layout: {
      // Sidebar: path.resolve(__dirname, 'client/components/layout/Sidebar/index.js'),
    },
  },
};
