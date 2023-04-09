"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const logout_1 = __importDefault(require("../operations/logout"));
async function logoutHandler(req, res, next) {
    try {
        const message = await (0, logout_1.default)({
            collection: req.collection,
            res,
            req,
        });
        return res.status(http_status_1.default.OK).json({ message });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = logoutHandler;
//# sourceMappingURL=logout.js.map