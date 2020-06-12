const path = require('path');
const Admin = require('./collections/Admin');
const AllFields = require('./collections/AllFields');
const Code = require('./collections/Code');
const Conditions = require('./collections/Conditions');
const CustomComponents = require('./collections/CustomComponents');
const File = require('./collections/File');
const FlexibleContent = require('./collections/FlexibleContent');
const HiddenFields = require('./collections/HiddenFields');
const Hooks = require('./collections/Hooks');
const Localized = require('./collections/Localized');
const Media = require('./collections/Media');
const Preview = require('./collections/Preview');
const PublicUsers = require('./collections/PublicUsers');
const RelationshipA = require('./collections/RelationshipA');
const RelationshipB = require('./collections/RelationshipB');
const RichText = require('./collections/RichText');
const StrictPolicies = require('./collections/StrictPolicies');
const Validations = require('./collections/Validations');

const FlexibleGlobal = require('./globals/FlexibleGlobal');
const NavigationRepeater = require('./globals/NavigationRepeater');
const GlobalWithPolicies = require('./globals/GlobalWithPolicies');

module.exports = {
  admin: {
    user: 'admins',
    disable: false,
  },
  collections: [
    Admin,
    AllFields,
    Code,
    Conditions,
    CustomComponents,
    File,
    FlexibleContent,
    HiddenFields,
    Hooks,
    Localized,
    Media,
    Preview,
    PublicUsers,
    RelationshipA,
    RelationshipB,
    RichText,
    StrictPolicies,
    Validations,
  ],
  globals: [NavigationRepeater, GlobalWithPolicies, FlexibleGlobal],
  cookiePrefix: 'payload',
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
  webpack: (config) => {
    return config;
  },
};
