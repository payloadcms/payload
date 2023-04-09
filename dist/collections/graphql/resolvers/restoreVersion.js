"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const restoreVersion_1 = __importDefault(require("../../operations/restoreVersion"));
function restoreVersionResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            id: args.id,
            req: context.req,
            depth: 0,
        };
        const result = await (0, restoreVersion_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = restoreVersionResolver;
//# sourceMappingURL=restoreVersion.js.map