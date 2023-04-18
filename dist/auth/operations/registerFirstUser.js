"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../errors");
async function registerFirstUser(args) {
    const { collection: { Model, config: { slug, auth: { verify, }, }, }, req: { payload, }, req, data, } = args;
    const count = await Model.countDocuments({});
    if (count >= 1)
        throw new errors_1.Forbidden(req.t);
    // /////////////////////////////////////
    // Register first user
    // /////////////////////////////////////
    const result = await payload.create({
        req,
        collection: slug,
        data,
        overrideAccess: true,
    });
    // auto-verify (if applicable)
    if (verify) {
        await payload.update({
            id: result.id,
            collection: slug,
            data: {
                _verified: true,
            },
        });
    }
    // /////////////////////////////////////
    // Log in new user
    // /////////////////////////////////////
    const { token } = await payload.login({
        ...args,
        collection: slug,
    });
    const resultToReturn = {
        ...result,
        token,
    };
    return {
        message: 'Registered and logged in successfully. Welcome!',
        user: resultToReturn,
    };
}
exports.default = registerFirstUser;
//# sourceMappingURL=registerFirstUser.js.map