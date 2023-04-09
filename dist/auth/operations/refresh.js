"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../../errors");
const getCookieExpiration_1 = __importDefault(require("../../utilities/getCookieExpiration"));
async function refresh(incomingArgs) {
    let args = incomingArgs;
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////
    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            args,
            operation: 'refresh',
        })) || args;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Refresh
    // /////////////////////////////////////
    const { collection: { config: collectionConfig, }, req: { payload: { secret, config, }, }, } = args;
    const opts = {
        expiresIn: args.collection.config.auth.tokenExpiration,
    };
    if (typeof args.token !== 'string')
        throw new errors_1.Forbidden(args.req.t);
    const payload = jsonwebtoken_1.default.verify(args.token, secret, {});
    delete payload.iat;
    delete payload.exp;
    const refreshedToken = jsonwebtoken_1.default.sign(payload, secret, opts);
    const exp = jsonwebtoken_1.default.decode(refreshedToken).exp;
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
        args.res.cookie(`${config.cookiePrefix}-token`, refreshedToken, cookieOptions);
    }
    // /////////////////////////////////////
    // After Refresh - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterRefresh.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            req: args.req,
            res: args.res,
            exp,
            token: refreshedToken,
        })) || args;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return {
        refreshedToken,
        exp,
        user: payload,
    };
}
exports.default = refresh;
//# sourceMappingURL=refresh.js.map