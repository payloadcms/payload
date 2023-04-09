"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const forgotPassword_1 = __importDefault(require("../operations/forgotPassword"));
async function forgotPasswordHandler(req, res, next) {
    try {
        await (0, forgotPassword_1.default)({
            req,
            collection: req.collection,
            data: { email: req.body.email },
            disableEmail: req.body.disableEmail,
            expiration: req.body.expiration,
        });
        return res.status(http_status_1.default.OK)
            .json({
            message: 'Success',
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = forgotPasswordHandler;
//# sourceMappingURL=forgotPassword.js.map