"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const findOne_1 = __importDefault(require("../operations/findOne"));
async function findOneHandler(req, res, next) {
    try {
        const result = await (0, findOne_1.default)({
            req,
            user: req.user,
            key: req.params.key,
        });
        return res.status(http_status_1.default.OK).json(result || { message: req.t('general:notFound'), value: null });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = findOneHandler;
//# sourceMappingURL=findOne.js.map