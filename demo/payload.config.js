const path = require('path');
const Page = require('./collections/Page');
const Category = require('./collections/Category');
const Post = require('./collections/Post');
const Layout = require('./collections/Layout');
const User = require('./collections/User');
const File = require('./collections/File');
const Media = require('./collections/Media');
const Header = require('./globals/Header');
const Footer = require('./globals/Footer');

module.exports = {
  // disableAdmin: true,
  collections: [
    Page,
    Category,
    Post,
    Layout,
    File,
    Media,
  ],
  User,
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
    scssOverrides: path.resolve(__dirname, 'client/scss/overrides.scss'),
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
  staticURL: '/uploads',
  staticDir: 'demo/upload',
  productionGraphQLPlayground: false,
  email: {
    provider: 'mock',
  },
  components: {
    layout: {
      // Sidebar: path.resolve(__dirname, 'client/components/layout/Sidebar/index.js'),
    },
  },
  hooks: {
    afterError: (err, response) => {
      console.error('global error config handler');
    },
  },
};
