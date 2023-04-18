"use strict";
/* eslint-disable no-param-reassign */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findOne_1 = __importDefault(require("../../operations/findOne"));
function findOneResolver(globalConfig) {
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
            req: context.req,
            draft: args.draft,
        };
        const result = await (0, findOne_1.default)(options);
        return result;
    };
}
exports.default = findOneResolver;
//# sourceMappingURL=findOne.js.map