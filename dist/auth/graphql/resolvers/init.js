"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = __importDefault(require("../../operations/init"));
function initResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            Model: collection.Model,
            req: context.req,
        };
        const result = await (0, init_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = initResolver;
//# sourceMappingURL=init.js.map