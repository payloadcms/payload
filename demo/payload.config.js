const path = require('path');
const Admin = require('./collections/Admin');
const AllFields = require('./collections/AllFields');
const Code = require('./collections/Code');
const CustomComponents = require('./collections/CustomComponents');
const File = require('./collections/File');
const FlexibleContent = require('./collections/FlexibleContent');
const Hooks = require('./collections/Hooks');
const HTML = require('./collections/HTML');
const Localized = require('./collections/Localized');
const Media = require('./collections/Media');
const Preview = require('./collections/Preview');
const RelationshipA = require('./collections/RelationshipA');
const RelationshipB = require('./collections/RelationshipB');
const RichText = require('./collections/RichText');
const StrictPolicies = require('./collections/StrictPolicies');

const FlexibleGlobal = require('./globals/FlexibleGlobal');
const NavigationRepeater = require('./globals/NavigationRepeater');
const GlobalWithPolicies = require('./globals/GlobalWithPolicies');

module.exports = {
  secret: 'SECRET_KEY',
  admin: {
    user: 'admins',
    disable: false,
  },
  collections: [
    Admin,
    AllFields,
    Code,
    CustomComponents,
    File,
    FlexibleContent,
    Hooks,
    HTML,
    Localized,
    Media,
    Preview,
    RelationshipA,
    RelationshipB,
    RichText,
    StrictPolicies,
  ],
  globals: [NavigationRepeater, GlobalWithPolicies, FlexibleGlobal],
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
  graphQL: {
    mutations: {},
    queries: {},
  },
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
