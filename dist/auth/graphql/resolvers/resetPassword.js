"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resetPassword_1 = __importDefault(require("../../operations/resetPassword"));
function resetPasswordResolver(collection) {
    async function resolver(_, args, context) {
        if (args.locale)
            context.req.locale = args.locale;
        if (args.fallbackLocale)
            context.req.fallbackLocale = args.fallbackLocale;
        const options = {
            collection,
            data: args,
            req: context.req,
            res: context.res,
            api: 'GraphQL',
        };
        const result = await (0, resetPassword_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = resetPasswordResolver;
//# sourceMappingURL=resetPassword.js.map