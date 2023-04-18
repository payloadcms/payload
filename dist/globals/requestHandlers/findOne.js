"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const findOne_1 = __importDefault(require("../operations/findOne"));
const isNumber_1 = require("../../utilities/isNumber");
function findOneHandler(globalConfig) {
    return async function handler(req, res, next) {
        var _a;
        try {
            const { slug } = globalConfig;
            const result = await (0, findOne_1.default)({
                req,
                globalConfig,
                slug,
                depth: (0, isNumber_1.isNumber)((_a = req.query) === null || _a === void 0 ? void 0 : _a.depth) ? Number(req.query.depth) : undefined,
                draft: req.query.draft === 'true',
            });
            return res.status(http_status_1.default.OK).json(result);
        }
        catch (error) {
            return next(error);
        }
    };
}
exports.default = findOneHandler;
//# sourceMappingURL=findOne.js.map