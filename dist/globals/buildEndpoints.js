"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findVersions_1 = __importDefault(require("./requestHandlers/findVersions"));
const findVersionByID_1 = __importDefault(require("./requestHandlers/findVersionByID"));
const restoreVersion_1 = __importDefault(require("./requestHandlers/restoreVersion"));
const update_1 = __importDefault(require("./requestHandlers/update"));
const findOne_1 = __importDefault(require("./requestHandlers/findOne"));
const docAccess_1 = __importDefault(require("./requestHandlers/docAccess"));
const buildEndpoints = (global) => {
    const { endpoints, slug } = global;
    if (global.versions) {
        endpoints.push(...[
            {
                path: '/versions',
                method: 'get',
                handler: (0, findVersions_1.default)(global),
            },
            {
                path: '/versions/:id',
                method: 'get',
                handler: (0, findVersionByID_1.default)(global),
            },
            {
                path: '/versions/:id',
                method: 'post',
                handler: (0, restoreVersion_1.default)(global),
            },
        ]);
    }
    endpoints.push(...[
        {
            path: '/access',
            method: 'get',
            handler: async (req, res, next) => (0, docAccess_1.default)(req, res, next, global),
        },
        {
            path: '/',
            method: 'get',
            handler: (0, findOne_1.default)(global),
        },
        {
            path: '/',
            method: 'post',
            handler: (0, update_1.default)(global),
        },
    ]);
    return endpoints;
};
exports.default = buildEndpoints;
//# sourceMappingURL=buildEndpoints.js.map