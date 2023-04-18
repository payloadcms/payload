"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../errors");
const executeAccess_1 = __importDefault(require("../executeAccess"));
async function unlock(args) {
    if (!Object.prototype.hasOwnProperty.call(args.data, 'email')) {
        throw new errors_1.APIError('Missing email.');
    }
    const { collection: { Model, config: collectionConfig, }, req, overrideAccess, } = args;
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    if (!overrideAccess) {
        await (0, executeAccess_1.default)({ req }, collectionConfig.access.unlock);
    }
    const options = { ...args };
    const { data } = options;
    // /////////////////////////////////////
    // Unlock
    // /////////////////////////////////////
    const user = await Model.findOne({ email: data.email.toLowerCase() });
    if (!user)
        return null;
    await user.resetLoginAttempts();
    return true;
}
exports.default = unlock;
//# sourceMappingURL=unlock.js.map