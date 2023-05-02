"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const unlock_1 = __importDefault(require("../operations/unlock"));
async function unlockHandler(req, res, next) {
    try {
        await (0, unlock_1.default)({
            req,
            collection: req.collection,
            data: { email: req.body.email },
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
exports.default = unlockHandler;
//# sourceMappingURL=unlock.js.map