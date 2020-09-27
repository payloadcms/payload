const Admin = require('./collections/Admin');
const AllFields = require('./collections/AllFields');
const Code = require('./collections/Code');
const Conditions = require('./collections/Conditions');
const CustomComponents = require('./collections/CustomComponents');
const File = require('./collections/File');
const Blocks = require('./collections/Blocks');
const HiddenFields = require('./collections/HiddenFields');
const Hooks = require('./collections/Hooks');
const Localized = require('./collections/Localized');
const LocalizedArray = require('./collections/LocalizedArray');
const LocalOperations = require('./collections/LocalOperations');
const Media = require('./collections/Media');
const NestedArrays = require('./collections/NestedArrays');
const Preview = require('./collections/Preview');
const PublicUsers = require('./collections/PublicUsers');
const RelationshipA = require('./collections/RelationshipA');
const RelationshipB = require('./collections/RelationshipB');
const RichText = require('./collections/RichText');
const Select = require('./collections/Select');
const StrictPolicies = require('./collections/StrictPolicies');
const Validations = require('./collections/Validations');

const BlocksGlobal = require('./globals/BlocksGlobal');
const NavigationArray = require('./globals/NavigationArray');
const GlobalWithStrictAccess = require('./globals/GlobalWithStrictAccess');

module.exports = {
  admin: {
    user: 'admins',
    // indexHTML: 'custom-index.html',
    meta: {
      titleSuffix: '- Payload Demo',
      // ogImage: '/static/find-image-here.jpg',
      // favicon: '/img/whatever.png',
    },
    disable: false,
    components: {
      // nav: () => (
      //   <div>Hello</div>
      // ),
    },
  },
  email: {
    fromName: 'Payload',
    fromAddress: 'hello@payloadcms.com',
  },
  collections: [
    Admin,
    AllFields,
    Code,
    Conditions,
    CustomComponents,
    File,
    Blocks,
    HiddenFields,
    Hooks,
    Localized,
    LocalizedArray,
    LocalOperations,
    Media,
    NestedArrays,
    Preview,
    PublicUsers,
    RelationshipA,
    RelationshipB,
    RichText,
    Select,
    StrictPolicies,
    Validations,
  ],
  globals: [
    NavigationArray,
    GlobalWithStrictAccess,
    BlocksGlobal,
  ],
  cookiePrefix: 'payload',
  serverURL: 'http://localhost:3000',
  cors: [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
  ],
  csrf: [
    'http://localhost:3000',
    'https://other-app-here.com',
  ],
  routes: {
    api: '/api',
    admin: '/admin',
    graphQL: '/graphql',
    graphQLPlayground: '/graphql-playground',
  },
  defaultDepth: 2,
  compression: {},
  paths: {
    scss: 'client/scss/overrides.scss',
  },
  graphQL: {
    maxComplexity: 1000,
    mutations: {},
    queries: {},
  },
  rateLimit: {
    window: 15 * 60 * 100,
    max: 100,
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
  hooks: {
    afterError: (err) => {
      console.error('global error config handler', err);
    },
  },
  webpack: (config) => config,
};
