"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const formatSuccess_1 = __importDefault(require("../../express/responses/formatSuccess"));
const update_1 = __importDefault(require("../operations/update"));
async function updateHandler(req, res, next) {
    try {
        const doc = await (0, update_1.default)({
            req,
            user: req.user,
            key: req.params.key,
            value: req.body.value || req.body,
        });
        return res.status(http_status_1.default.OK).json({
            ...(0, formatSuccess_1.default)(req.t('general:updatedSuccessfully'), 'message'),
            doc,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = updateHandler;
//# sourceMappingURL=update.js.map