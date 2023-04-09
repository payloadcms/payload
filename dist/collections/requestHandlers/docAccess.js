"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const docAccess_1 = require("../operations/docAccess");
async function docAccessRequestHandler(req, res, next) {
    try {
        const accessResults = await (0, docAccess_1.docAccess)({
            req,
            id: req.params.id,
        });
        return res.status(http_status_1.default.OK).json(accessResults);
    }
    catch (error) {
        return next(error);
    }
}
exports.default = docAccessRequestHandler;
//# sourceMappingURL=docAccess.js.map