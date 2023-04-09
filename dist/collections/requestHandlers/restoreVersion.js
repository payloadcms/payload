"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const formatSuccess_1 = __importDefault(require("../../express/responses/formatSuccess"));
const restoreVersion_1 = __importDefault(require("../operations/restoreVersion"));
async function restoreVersionHandler(req, res, next) {
    const options = {
        req,
        collection: req.collection,
        id: req.params.id,
        depth: Number(req.query.depth),
        payload: req.payload,
    };
    try {
        const doc = await (0, restoreVersion_1.default)(options);
        return res.status(http_status_1.default.OK).json({
            ...(0, formatSuccess_1.default)(req.t('version:restoredSuccessfully'), 'message'),
            doc,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = restoreVersionHandler;
//# sourceMappingURL=restoreVersion.js.map