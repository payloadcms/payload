"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_1 = __importDefault(require("../../operations/update"));
function updateResolver(globalConfig) {
    return async function resolver(_, args, context) {
        if (args.locale)
            context.req.locale = args.locale;
        if (args.fallbackLocale)
            context.req.fallbackLocale = args.fallbackLocale;
        const { slug } = globalConfig;
        const options = {
            globalConfig,
            slug,
            depth: 0,
            data: args.data,
            req: context.req,
            draft: args.draft,
        };
        const result = await (0, update_1.default)(options);
        return result;
    };
}
exports.default = updateResolver;
//# sourceMappingURL=update.js.map