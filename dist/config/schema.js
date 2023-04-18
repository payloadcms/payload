"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpointsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const component = joi_1.default.alternatives().try(joi_1.default.object().unknown(), joi_1.default.func());
exports.endpointsSchema = joi_1.default.array().items(joi_1.default.object({
    path: joi_1.default.string(),
    method: joi_1.default.string().valid('get', 'head', 'post', 'put', 'patch', 'delete', 'connect', 'options'),
    root: joi_1.default.bool(),
    handler: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.func()), joi_1.default.func()),
    custom: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
}));
exports.default = joi_1.default.object({
    serverURL: joi_1.default.string()
        .uri()
        .allow('')
        .custom((value, helper) => {
        const urlWithoutProtocol = value.split('//')[1];
        if (!urlWithoutProtocol) {
            return helper.message({ custom: 'You need to include either "https://" or "http://" in your serverURL.' });
        }
        if (urlWithoutProtocol.indexOf('/') > -1) {
            return helper.message({ custom: 'Your serverURL cannot have a path. It can only contain a protocol, a domain, and an optional port.' });
        }
        return value;
    }),
    cookiePrefix: joi_1.default.string(),
    routes: joi_1.default.object({
        admin: joi_1.default.string(),
        api: joi_1.default.string(),
        graphQL: joi_1.default.string(),
        graphQLPlayground: joi_1.default.string(),
    }),
    typescript: joi_1.default.object({
        outputFile: joi_1.default.string(),
    }),
    collections: joi_1.default.array(),
    endpoints: exports.endpointsSchema,
    globals: joi_1.default.array(),
    admin: joi_1.default.object({
        user: joi_1.default.string(),
        buildPath: joi_1.default.string(),
        meta: joi_1.default.object()
            .keys({
            titleSuffix: joi_1.default.string(),
            ogImage: joi_1.default.string(),
            favicon: joi_1.default.string(),
        }),
        disable: joi_1.default.bool(),
        indexHTML: joi_1.default.string(),
        css: joi_1.default.string(),
        dateFormat: joi_1.default.string(),
        avatar: joi_1.default.alternatives()
            .try(joi_1.default.string(), component),
        logoutRoute: joi_1.default.string(),
        inactivityRoute: joi_1.default.string(),
        components: joi_1.default.object()
            .keys({
            routes: joi_1.default.array()
                .items(joi_1.default.object().keys({
                Component: component.required(),
                path: joi_1.default.string().required(),
                exact: joi_1.default.bool(),
                strict: joi_1.default.bool(),
                sensitive: joi_1.default.bool(),
            })),
            providers: joi_1.default.array().items(component),
            beforeDashboard: joi_1.default.array().items(component),
            afterDashboard: joi_1.default.array().items(component),
            beforeLogin: joi_1.default.array().items(component),
            afterLogin: joi_1.default.array().items(component),
            beforeNavLinks: joi_1.default.array().items(component),
            afterNavLinks: joi_1.default.array().items(component),
            Nav: component,
            logout: joi_1.default.object({
                Button: component,
            }),
            views: joi_1.default.object({
                Dashboard: component,
                Account: component,
            }),
            graphics: joi_1.default.object({
                Icon: component,
                Logo: component,
            }),
        }),
        webpack: joi_1.default.func(),
    }),
    email: joi_1.default.object(),
    i18n: joi_1.default.object(),
    defaultDepth: joi_1.default.number()
        .min(0)
        .max(30),
    maxDepth: joi_1.default.number()
        .min(0)
        .max(100),
    defaultMaxTextLength: joi_1.default.number(),
    csrf: joi_1.default.array()
        .items(joi_1.default.string().allow(''))
        .sparse(),
    cors: [
        joi_1.default.string()
            .valid('*'),
        joi_1.default.array()
            .items(joi_1.default.string()),
    ],
    express: joi_1.default.object()
        .keys({
        json: joi_1.default.object(),
        compression: joi_1.default.object(),
        middleware: joi_1.default.array().items(joi_1.default.func()),
        preMiddleware: joi_1.default.array().items(joi_1.default.func()),
        postMiddleware: joi_1.default.array().items(joi_1.default.func()),
    }),
    local: joi_1.default.boolean(),
    upload: joi_1.default.object(),
    indexSortableFields: joi_1.default.boolean(),
    rateLimit: joi_1.default.object()
        .keys({
        window: joi_1.default.number(),
        max: joi_1.default.number(),
        trustProxy: joi_1.default.boolean(),
        skip: joi_1.default.func(),
    }),
    graphQL: joi_1.default.object()
        .keys({
        mutations: joi_1.default.function(),
        queries: joi_1.default.function(),
        maxComplexity: joi_1.default.number(),
        disablePlaygroundInProduction: joi_1.default.boolean(),
        disable: joi_1.default.boolean(),
        schemaOutputFile: joi_1.default.string(),
    }),
    localization: joi_1.default.alternatives()
        .try(joi_1.default.object().keys({
        locales: joi_1.default.array().items(joi_1.default.string()),
        defaultLocale: joi_1.default.string(),
        fallback: joi_1.default.boolean(),
    }), joi_1.default.boolean()),
    hooks: joi_1.default.object().keys({
        afterError: joi_1.default.func(),
    }),
    telemetry: joi_1.default.boolean(),
    plugins: joi_1.default.array().items(joi_1.default.func()),
    onInit: joi_1.default.func(),
    debug: joi_1.default.boolean(),
    custom: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
});
//# sourceMappingURL=schema.js.map