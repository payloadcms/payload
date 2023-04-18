"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const updateByID_1 = __importDefault(require("../../operations/updateByID"));
function updateResolver(collection) {
    async function resolver(_, args, context) {
        if (args.locale)
            context.req.locale = args.locale;
        if (args.fallbackLocale)
            context.req.fallbackLocale = args.fallbackLocale;
        const options = {
            collection,
            data: args.data,
            id: args.id,
            depth: 0,
            req: context.req,
            draft: args.draft,
            autosave: args.autosave,
        };
        const result = await (0, updateByID_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = updateResolver;
//# sourceMappingURL=update.js.map