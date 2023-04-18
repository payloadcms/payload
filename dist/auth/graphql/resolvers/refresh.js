"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const refresh_1 = __importDefault(require("../../operations/refresh"));
const getExtractJWT_1 = __importDefault(require("../../getExtractJWT"));
function refreshResolver(collection) {
    async function resolver(_, args, context) {
        let token;
        const extractJWT = (0, getExtractJWT_1.default)(context.req.payload.config);
        token = extractJWT(context.req);
        if (args.token) {
            token = args.token;
        }
        const options = {
            collection,
            token,
            req: context.req,
            res: context.res,
        };
        const result = await (0, refresh_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = refreshResolver;
//# sourceMappingURL=refresh.js.map