"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const login_1 = __importDefault(require("../operations/login"));
async function loginHandler(req, res, next) {
    try {
        const result = await (0, login_1.default)({
            req,
            res,
            collection: req.collection,
            data: req.body,
            depth: parseInt(String(req.query.depth), 10),
        });
        return res.status(http_status_1.default.OK)
            .json({
            message: 'Auth Passed',
            user: result.user,
            token: result.token,
            exp: result.exp,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = loginHandler;
//# sourceMappingURL=login.js.map