"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const defaultAccess_1 = __importDefault(require("../../auth/defaultAccess"));
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const UnathorizedError_1 = __importDefault(require("../../errors/UnathorizedError"));
async function update(args) {
    const { overrideAccess, user, req, req: { payload: { preferences: { Model, }, }, }, key, value, } = args;
    if (!user) {
        throw new UnathorizedError_1.default(req.t);
    }
    if (!overrideAccess) {
        await (0, executeAccess_1.default)({ req }, defaultAccess_1.default);
    }
    const filter = { user: user.id, key, userCollection: user.collection };
    const preference = { ...filter, value };
    await Model.updateOne(filter, { ...preference }, { upsert: true });
    return preference;
}
exports.default = update;
//# sourceMappingURL=update.js.map