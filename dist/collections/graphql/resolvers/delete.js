"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deleteByID_1 = __importDefault(require("../../operations/deleteByID"));
function getDeleteResolver(collection) {
    async function resolver(_, args, context) {
        if (args.locale)
            context.req.locale = args.locale;
        if (args.fallbackLocale)
            context.req.fallbackLocale = args.fallbackLocale;
        const options = {
            collection,
            id: args.id,
            req: context.req,
            depth: 0,
        };
        const result = await (0, deleteByID_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = getDeleteResolver;
//# sourceMappingURL=delete.js.map