"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../../errors");
async function verifyEmail(args) {
    if (!Object.prototype.hasOwnProperty.call(args, 'token')) {
        throw new errors_1.APIError('Missing required data.', http_status_1.default.BAD_REQUEST);
    }
    const user = await args.collection.Model.findOne({
        _verificationToken: args.token,
    });
    if (!user)
        throw new errors_1.APIError('Verification token is invalid.', http_status_1.default.BAD_REQUEST);
    if (user && user._verified === true)
        throw new errors_1.APIError('This account has already been activated.', http_status_1.default.ACCEPTED);
    user._verified = true;
    user._verificationToken = undefined;
    await user.save();
    return true;
}
exports.default = verifyEmail;
//# sourceMappingURL=verifyEmail.js.map