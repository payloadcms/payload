"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getExtractJWT_1 = __importDefault(require("../getExtractJWT"));
const refresh_1 = __importDefault(require("../operations/refresh"));
async function refreshHandler(req, res, next) {
    try {
        let token;
        const extractJWT = (0, getExtractJWT_1.default)(req.payload.config);
        token = extractJWT(req);
        if (req.body.token) {
            token = req.body.token;
        }
        const result = await (0, refresh_1.default)({
            req,
            res,
            collection: req.collection,
            token,
        });
        return res.status(200).json({
            message: 'Token refresh successful',
            ...result,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = refreshHandler;
//# sourceMappingURL=refresh.js.map