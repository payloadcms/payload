"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authDefaults = exports.defaults = void 0;
const defaultAccess_1 = __importDefault(require("../../auth/defaultAccess"));
exports.defaults = {
    access: {
        create: defaultAccess_1.default,
        read: defaultAccess_1.default,
        update: defaultAccess_1.default,
        delete: defaultAccess_1.default,
        unlock: defaultAccess_1.default,
    },
    timestamps: true,
    admin: {
        useAsTitle: 'id',
        components: {},
        enableRichTextRelationship: true,
        pagination: {
            defaultLimit: 10,
            limits: [5, 10, 25, 50, 100],
        },
    },
    fields: [],
    hooks: {
        beforeOperation: [],
        beforeValidate: [],
        beforeChange: [],
        afterChange: [],
        beforeRead: [],
        afterRead: [],
        beforeDelete: [],
        afterDelete: [],
        beforeLogin: [],
        afterLogin: [],
        afterLogout: [],
        afterRefresh: [],
        afterMe: [],
        afterForgotPassword: [],
    },
    endpoints: [],
    auth: false,
    upload: false,
    versions: false,
};
exports.authDefaults = {
    tokenExpiration: 7200,
    maxLoginAttempts: 5,
    lockTime: 600000,
    cookies: {
        secure: false,
        sameSite: 'Lax',
    },
    verify: false,
    forgotPassword: {},
};
//# sourceMappingURL=defaults.js.map