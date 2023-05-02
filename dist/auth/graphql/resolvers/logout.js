"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logout_1 = __importDefault(require("../../operations/logout"));
function logoutResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            res: context.res,
            req: context.req,
        };
        const result = await (0, logout_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = logoutResolver;
//# sourceMappingURL=logout.js.map