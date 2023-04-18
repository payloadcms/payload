"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const verifyEmail_1 = __importDefault(require("../../operations/verifyEmail"));
function verifyEmailResolver(collection) {
    async function resolver(_, args, context) {
        if (args.locale)
            context.req.locale = args.locale;
        if (args.fallbackLocale)
            context.req.fallbackLocale = args.fallbackLocale;
        const options = {
            collection,
            token: args.token,
            req: context.req,
            res: context.res,
            api: 'GraphQL',
        };
        const success = await (0, verifyEmail_1.default)(options);
        return success;
    }
    return resolver;
}
exports.default = verifyEmailResolver;
//# sourceMappingURL=verifyEmail.js.map