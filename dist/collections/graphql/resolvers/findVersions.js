"use strict";
/* eslint-disable no-param-reassign */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findVersions_1 = __importDefault(require("../../operations/findVersions"));
function findVersionsResolver(collection) {
    async function resolver(_, args, context) {
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
            depth: 0,
        };
        const result = await (0, findVersions_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = findVersionsResolver;
//# sourceMappingURL=findVersions.js.map