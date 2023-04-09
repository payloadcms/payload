"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findVersionByID_1 = __importDefault(require("../../operations/findVersionByID"));
function findVersionByIDResolver(globalConfig) {
    return async function resolver(_, args, context) {
        if (args.locale)
            context.req.locale = args.locale;
        if (args.fallbackLocale)
            context.req.fallbackLocale = args.fallbackLocale;
        const options = {
            id: args.id,
            globalConfig,
            req: context.req,
            draft: args.draft,
            depth: 0,
        };
        const result = await (0, findVersionByID_1.default)(options);
        return result;
    };
}
exports.default = findVersionByIDResolver;
//# sourceMappingURL=findVersionByID.js.map