"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_1 = __importDefault(require("../../operations/find"));
function findResolver(collection) {
    return async function resolver(_, args, context) {
        if (args.locale)
            context.req.locale = args.locale;
        if (args.fallbackLocale)
            context.req.fallbackLocale = args.fallbackLocale;
        const options = {
            collection,
            where: args.where,
            limit: args.limit,
            page: args.page,
            sort: args.sort,
            req: context.req,
            draft: args.draft,
            depth: 0,
        };
        const results = await (0, find_1.default)(options);
        return results;
    };
}
exports.default = findResolver;
//# sourceMappingURL=find.js.map