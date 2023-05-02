"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const resetPassword_1 = __importDefault(require("../operations/resetPassword"));
async function resetPasswordHandler(req, res, next) {
    try {
        const result = await (0, resetPassword_1.default)({
            collection: req.collection,
            data: req.body,
            req,
            res,
        });
        return res.status(http_status_1.default.OK)
            .json({
            message: 'Password reset successfully.',
            token: result.token,
            user: result.user,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = resetPasswordHandler;
//# sourceMappingURL=resetPassword.js.map