"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unlock_1 = __importDefault(require("../../operations/unlock"));
function unlockResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            data: { email: args.email },
            req: context.req,
        };
        const result = await (0, unlock_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = unlockResolver;
//# sourceMappingURL=unlock.js.map