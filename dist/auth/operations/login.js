"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../../errors");
const getCookieExpiration_1 = __importDefault(require("../../utilities/getCookieExpiration"));
const isLocked_1 = __importDefault(require("../isLocked"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const types_1 = require("../../fields/config/types");
const afterRead_1 = require("../../fields/hooks/afterRead");
const unlock_1 = __importDefault(require("./unlock"));
async function login(incomingArgs) {
    let args = incomingArgs;
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////
    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            args,
            operation: 'login',
        })) || args;
    }, Promise.resolve());
    const { collection: { Model, config: collectionConfig, }, data, req: { payload: { secret, config, }, }, req, depth, overrideAccess, showHiddenFields, } = args;
    // /////////////////////////////////////
    // Login
    // /////////////////////////////////////
    const { email: unsanitizedEmail, password } = data;
    const email = unsanitizedEmail ? unsanitizedEmail.toLowerCase().trim() : null;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Improper typing in library, additional args should be optional
    const userDoc = await Model.findByUsername(email);
    if (!userDoc || (args.collection.config.auth.verify && userDoc._verified === false)) {
        throw new errors_1.AuthenticationError(req.t);
    }
    if (userDoc && (0, isLocked_1.default)(userDoc.lockUntil)) {
        throw new errors_1.LockedAuth(req.t);
    }
    const authResult = await userDoc.authenticate(password);
    const maxLoginAttemptsEnabled = args.collection.config.auth.maxLoginAttempts > 0;
    if (!authResult.user) {
        if (maxLoginAttemptsEnabled)
            await userDoc.incLoginAttempts();
        throw new errors_1.AuthenticationError(req.t);
    }
    if (maxLoginAttemptsEnabled) {
        await (0, unlock_1.default)({
            collection: {
                Model,
                config: collectionConfig,
            },
            req,
            data,
            overrideAccess: true,
        });
    }
    let user = userDoc.toJSON({ virtuals: true });
    user = JSON.parse(JSON.stringify(user));
    user = (0, sanitizeInternalFields_1.default)(user);
    const fieldsToSign = collectionConfig.fields.reduce((signedFields, field) => {
        const result = {
            ...signedFields,
        };
        if (!(0, types_1.fieldAffectsData)(field) && (0, types_1.fieldHasSubFields)(field)) {
            field.fields.forEach((subField) => {
                if ((0, types_1.fieldAffectsData)(subField) && subField.saveToJWT) {
                    result[subField.name] = user[subField.name];
                }
            });
        }
        if ((0, types_1.fieldAffectsData)(field) && field.saveToJWT) {
            result[field.name] = user[field.name];
        }
        return result;
    }, {
        email,
        id: user.id,
        collection: collectionConfig.slug,
    });
    await collectionConfig.hooks.beforeLogin.reduce(async (priorHook, hook) => {
        await priorHook;
        user = (await hook({
            user,
            req: args.req,
        })) || user;
    }, Promise.resolve());
    const token = jsonwebtoken_1.default.sign(fieldsToSign, secret, {
        expiresIn: collectionConfig.auth.tokenExpiration,
    });
    if (args.res) {
        const cookieOptions = {
            path: '/',
            httpOnly: true,
            expires: (0, getCookieExpiration_1.default)(collectionConfig.auth.tokenExpiration),
            secure: collectionConfig.auth.cookies.secure,
            sameSite: collectionConfig.auth.cookies.sameSite,
            domain: undefined,
        };
        if (collectionConfig.auth.cookies.domain)
            cookieOptions.domain = collectionConfig.auth.cookies.domain;
        args.res.cookie(`${config.cookiePrefix}-token`, token, cookieOptions);
    }
    req.user = user;
    // /////////////////////////////////////
    // afterLogin - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterLogin.reduce(async (priorHook, hook) => {
        await priorHook;
        user = await hook({
            user,
            req: args.req,
            token,
        }) || user;
    }, Promise.resolve());
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    user = await (0, afterRead_1.afterRead)({
        depth,
        doc: user,
        entityConfig: collectionConfig,
        overrideAccess,
        req,
        showHiddenFields,
    });
    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;
        user = await hook({
            req,
            doc: user,
        }) || user;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return {
        token,
        user,
        exp: jsonwebtoken_1.default.decode(token).exp,
    };
}
exports.default = login;
//# sourceMappingURL=login.js.map