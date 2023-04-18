"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_1 = __importDefault(require("../../operations/create"));
function createResolver(collection) {
    return async function resolver(_, args, context) {
        if (args.locale) {
            context.req.locale = args.locale;
        }
        const options = {
            collection,
            data: args.data,
            req: context.req,
            draft: args.draft,
            depth: 0,
        };
        const result = await (0, create_1.default)(options);
        return result;
    };
}
exports.default = createResolver;
//# sourceMappingURL=create.js.map