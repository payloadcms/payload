"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const me_1 = __importDefault(require("../../operations/me"));
function meResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            req: context.req,
        };
        return (0, me_1.default)(options);
    }
    return resolver;
}
exports.default = meResolver;
//# sourceMappingURL=me.js.map