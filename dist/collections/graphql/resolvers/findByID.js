"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findByID_1 = __importDefault(require("../../operations/findByID"));
function findByIDResolver(collection) {
    return async function resolver(_, args, context) {
        const { req } = context;
        if (args.locale)
            req.locale = args.locale;
        if (args.fallbackLocale)
            req.fallbackLocale = args.fallbackLocale;
        const options = {
            collection,
            id: args.id,
            req,
            draft: args.draft,
            depth: 0,
        };
        const result = await (0, findByID_1.default)(options);
        return result;
    };
}
exports.default = findByIDResolver;
//# sourceMappingURL=findByID.js.map