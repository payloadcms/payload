"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const forgotPassword_1 = __importDefault(require("../../operations/forgotPassword"));
function forgotPasswordResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            data: {
                email: args.email,
            },
            req: context.req,
            disableEmail: args.disableEmail,
            expiration: args.expiration,
        };
        await (0, forgotPassword_1.default)(options);
        return true;
    }
    return resolver;
}
exports.default = forgotPasswordResolver;
//# sourceMappingURL=forgotPassword.js.map