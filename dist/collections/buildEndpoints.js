"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_1 = __importDefault(require("./requestHandlers/find"));
const verifyEmail_1 = __importDefault(require("../auth/requestHandlers/verifyEmail"));
const unlock_1 = __importDefault(require("../auth/requestHandlers/unlock"));
const create_1 = __importDefault(require("./requestHandlers/create"));
const init_1 = __importDefault(require("../auth/requestHandlers/init"));
const login_1 = __importDefault(require("../auth/requestHandlers/login"));
const refresh_1 = __importDefault(require("../auth/requestHandlers/refresh"));
const me_1 = __importDefault(require("../auth/requestHandlers/me"));
const registerFirstUser_1 = __importDefault(require("../auth/requestHandlers/registerFirstUser"));
const forgotPassword_1 = __importDefault(require("../auth/requestHandlers/forgotPassword"));
const resetPassword_1 = __importDefault(require("../auth/requestHandlers/resetPassword"));
const findVersions_1 = __importDefault(require("./requestHandlers/findVersions"));
const findVersionByID_1 = __importDefault(require("./requestHandlers/findVersionByID"));
const restoreVersion_1 = __importDefault(require("./requestHandlers/restoreVersion"));
const delete_1 = __importDefault(require("./requestHandlers/delete"));
const findByID_1 = __importDefault(require("./requestHandlers/findByID"));
const update_1 = __importDefault(require("./requestHandlers/update"));
const updateByID_1 = __importStar(require("./requestHandlers/updateByID"));
const logout_1 = __importDefault(require("../auth/requestHandlers/logout"));
const docAccess_1 = __importDefault(require("./requestHandlers/docAccess"));
const deleteByID_1 = __importDefault(require("./requestHandlers/deleteByID"));
const buildEndpoints = (collection) => {
    let { endpoints } = collection;
    if (collection.auth) {
        if (!collection.auth.disableLocalStrategy) {
            if (collection.auth.verify) {
                endpoints.push({
                    path: '/verify/:token',
                    method: 'post',
                    handler: verifyEmail_1.default,
                });
            }
            if (collection.auth.maxLoginAttempts > 0) {
                endpoints.push({
                    path: '/unlock',
                    method: 'post',
                    handler: unlock_1.default,
                });
            }
            endpoints = endpoints.concat([
                {
                    path: '/login',
                    method: 'post',
                    handler: login_1.default,
                },
                {
                    path: '/first-register',
                    method: 'post',
                    handler: registerFirstUser_1.default,
                },
                {
                    path: '/forgot-password',
                    method: 'post',
                    handler: forgotPassword_1.default,
                },
                {
                    path: '/reset-password',
                    method: 'post',
                    handler: resetPassword_1.default,
                },
            ]);
        }
        endpoints = endpoints.concat([
            {
                path: '/init',
                method: 'get',
                handler: init_1.default,
            },
            {
                path: '/me',
                method: 'get',
                handler: me_1.default,
            },
            {
                path: '/logout',
                method: 'post',
                handler: logout_1.default,
            },
            {
                path: '/refresh-token',
                method: 'post',
                handler: refresh_1.default,
            },
        ]);
    }
    if (collection.versions) {
        endpoints = endpoints.concat([
            {
                path: '/versions',
                method: 'get',
                handler: findVersions_1.default,
            },
            {
                path: '/versions/:id',
                method: 'get',
                handler: findVersionByID_1.default,
            },
            {
                path: '/versions/:id',
                method: 'post',
                handler: restoreVersion_1.default,
            },
        ]);
    }
    return endpoints.concat([
        {
            path: '/',
            method: 'get',
            handler: find_1.default,
        },
        {
            path: '/',
            method: 'post',
            handler: create_1.default,
        },
        {
            path: '/access/:id',
            method: 'get',
            handler: docAccess_1.default,
        },
        {
            path: '/:id',
            method: 'put',
            handler: updateByID_1.deprecatedUpdate,
        },
        {
            path: '/',
            method: 'patch',
            handler: update_1.default,
        },
        {
            path: '/:id',
            method: 'patch',
            handler: updateByID_1.default,
        },
        {
            path: '/:id',
            method: 'get',
            handler: findByID_1.default,
        },
        {
            path: '/:id',
            method: 'delete',
            handler: deleteByID_1.default,
        },
        {
            path: '/',
            method: 'delete',
            handler: delete_1.default,
        },
    ]);
};
exports.default = buildEndpoints;
//# sourceMappingURL=buildEndpoints.js.map