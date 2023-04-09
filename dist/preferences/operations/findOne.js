"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const defaultAccess_1 = __importDefault(require("../../auth/defaultAccess"));
const UnathorizedError_1 = __importDefault(require("../../errors/UnathorizedError"));
async function findOne(args) {
    const { overrideAccess, req, req: { payload: { preferences: { Model }, }, }, user, key, } = args;
    if (!user) {
        throw new UnathorizedError_1.default(req.t);
    }
    if (!overrideAccess) {
        await (0, executeAccess_1.default)({ req }, defaultAccess_1.default);
    }
    const filter = {
        key,
        user: user.id,
        userCollection: user.collection,
    };
    const doc = await Model.findOne(filter);
    if (!doc)
        return null;
    return doc;
}
exports.default = findOne;
//# sourceMappingURL=findOne.js.map