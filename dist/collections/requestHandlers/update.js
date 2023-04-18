"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const formatSuccess_1 = __importDefault(require("../../express/responses/formatSuccess"));
const update_1 = __importDefault(require("../operations/update"));
const getTranslation_1 = require("../../utilities/getTranslation");
async function updateHandler(req, res, next) {
    try {
        const draft = req.query.draft === 'true';
        const result = await (0, update_1.default)({
            req,
            collection: req.collection,
            where: req.query.where,
            data: req.body,
            depth: parseInt(String(req.query.depth), 10),
            draft,
        });
        if (result.errors.length === 0) {
            const message = req.t('general:updatedCountSuccessfully', {
                count: result.docs.length,
                label: (0, getTranslation_1.getTranslation)(req.collection.config.labels[result.docs.length > 1 ? 'plural' : 'singular'], req.i18n),
            });
            return res.status(http_status_1.default.OK).json({
                ...(0, formatSuccess_1.default)(message, 'message'),
                ...result,
            });
        }
        const total = result.docs.length + result.errors.length;
        const message = req.t('error:unableToUpdateCount', {
            count: result.errors.length,
            total,
            label: (0, getTranslation_1.getTranslation)(req.collection.config.labels[total > 1 ? 'plural' : 'singular'], req.i18n),
        });
        return res.status(http_status_1.default.BAD_REQUEST).json({
            ...(0, formatSuccess_1.default)(message, 'message'),
            ...result,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = updateHandler;
//# sourceMappingURL=update.js.map