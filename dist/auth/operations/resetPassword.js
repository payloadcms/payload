"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../../errors");
const getCookieExpiration_1 = __importDefault(require("../../utilities/getCookieExpiration"));
const types_1 = require("../../fields/config/types");
async function resetPassword(args) {
    if (!Object.prototype.hasOwnProperty.call(args.data, 'token')
        || !Object.prototype.hasOwnProperty.call(args.data, 'password')) {
        throw new errors_1.APIError('Missing required data.');
    }
    const { collection: { Model, config: collectionConfig, }, req: { payload: { config, secret, }, payload, }, overrideAccess, data, } = args;
    // /////////////////////////////////////
    // Reset Password
    // /////////////////////////////////////
    const user = await Model.findOne({
        resetPasswordToken: data.token,
        resetPasswordExpiration: { $gt: Date.now() },
    });
    if (!user)
        throw new errors_1.APIError('Token is either invalid or has expired.');
    await user.setPassword(data.password);
    user.resetPasswordExpiration = Date.now();
    if (collectionConfig.auth.verify) {
        user._verified = true;
    }
    await user.save();
    await user.authenticate(data.password);
    const fieldsToSign = collectionConfig.fields.reduce((signedFields, field) => {
        if ((0, types_1.fieldAffectsData)(field) && field.saveToJWT) {
            return {
                ...signedFields,
                [field.name]: user[field.name],
            };
        }
        return signedFields;
    }, {
        email: user.email,
        id: user.id,
        collection: collectionConfig.slug,
    });
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
    const fullUser = await payload.findByID({ collection: collectionConfig.slug, id: user.id, overrideAccess });
    return { token, user: fullUser };
}
exports.default = resetPassword;
//# sourceMappingURL=resetPassword.js.map