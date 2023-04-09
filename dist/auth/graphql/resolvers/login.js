"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const login_1 = __importDefault(require("../../operations/login"));
function loginResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            data: {
                email: args.email,
                password: args.password,
            },
            req: context.req,
            res: context.res,
        };
        const result = (0, login_1.default)(options);
        return result;
    }
    return resolver;
}
exports.default = loginResolver;
//# sourceMappingURL=login.js.map