"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = void 0;
const path_1 = __importDefault(require("path"));
exports.defaults = {
    serverURL: '',
    defaultDepth: 2,
    maxDepth: 10,
    defaultMaxTextLength: 40000,
    collections: [],
    globals: [],
    endpoints: [],
    cookiePrefix: 'payload',
    csrf: [],
    cors: [],
    admin: {
        buildPath: path_1.default.resolve(process.cwd(), './build'),
        meta: {
            titleSuffix: '- Payload',
        },
        disable: false,
        indexHTML: path_1.default.resolve(__dirname, '../admin/index.html'),
        avatar: 'default',
        components: {},
        logoutRoute: '/logout',
        inactivityRoute: '/logout-inactivity',
        css: path_1.default.resolve(__dirname, '../admin/scss/custom.css'),
        dateFormat: 'MMMM do yyyy, h:mm a',
    },
    typescript: {
        outputFile: `${typeof (process === null || process === void 0 ? void 0 : process.cwd) === 'function' ? process.cwd() : ''}/payload-types.ts`,
    },
    upload: {},
    graphQL: {
        maxComplexity: 1000,
        disablePlaygroundInProduction: true,
        schemaOutputFile: `${typeof (process === null || process === void 0 ? void 0 : process.cwd) === 'function' ? process.cwd() : ''}/schema.graphql`,
    },
    routes: {
        admin: '/admin',
        api: '/api',
        graphQL: '/graphql',
        graphQLPlayground: '/graphql-playground',
    },
    rateLimit: {
        window: 15 * 60 * 100,
        max: 500,
    },
    express: {
        json: {},
        compression: {},
        middleware: [],
        preMiddleware: [],
        postMiddleware: [],
    },
    hooks: {},
    localization: false,
    telemetry: true,
    custom: {},
};
//# sourceMappingURL=defaults.js.map