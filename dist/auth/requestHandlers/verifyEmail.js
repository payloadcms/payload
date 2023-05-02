"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const verifyEmail_1 = __importDefault(require("../operations/verifyEmail"));
async function verifyEmailHandler(req, res, next) {
    try {
        await (0, verifyEmail_1.default)({
            collection: req.collection,
            token: req.params.token,
        });
        return res.status(http_status_1.default.OK)
            .json({
            message: 'Email verified successfully.',
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = verifyEmailHandler;
//# sourceMappingURL=verifyEmail.js.map