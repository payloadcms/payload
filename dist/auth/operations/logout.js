"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../../errors");
async function logout(incomingArgs) {
    let args = incomingArgs;
    const { res, req: { payload: { config, }, user, }, req, collection: { config: collectionConfig, }, collection, } = incomingArgs;
    if (!user)
        throw new errors_1.APIError('No User', http_status_1.default.BAD_REQUEST);
    if (user.collection !== collectionConfig.slug)
        throw new errors_1.APIError('Incorrect collection', http_status_1.default.FORBIDDEN);
    const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: collectionConfig.auth.cookies.secure,
        sameSite: collectionConfig.auth.cookies.sameSite,
        domain: undefined,
    };
    if (collectionConfig.auth.cookies.domain)
        cookieOptions.domain = collectionConfig.auth.cookies.domain;
    await collection.config.hooks.afterLogout.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            req,
            res,
        })) || args;
    }, Promise.resolve());
    res.clearCookie(`${config.cookiePrefix}-token`, cookieOptions);
    return req.t('authentication:loggedOutSuccessfully');
}
exports.default = logout;
//# sourceMappingURL=logout.js.map