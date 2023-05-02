"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const access_1 = __importDefault(require("../operations/access"));
async function accessRequestHandler(req, res, next) {
    try {
        const accessResults = await (0, access_1.default)({
            req,
        });
        return res.status(http_status_1.default.OK)
            .json(accessResults);
    }
    catch (error) {
        return next(error);
    }
}
exports.default = accessRequestHandler;
//# sourceMappingURL=access.js.map