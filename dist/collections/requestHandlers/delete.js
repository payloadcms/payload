"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const delete_1 = __importDefault(require("../operations/delete"));
const formatSuccess_1 = __importDefault(require("../../express/responses/formatSuccess"));
const getTranslation_1 = require("../../utilities/getTranslation");
async function deleteHandler(req, res, next) {
    try {
        const result = await (0, delete_1.default)({
            req,
            collection: req.collection,
            where: req.query.where,
            depth: parseInt(String(req.query.depth), 10),
        });
        if (result.errors.length === 0) {
            const message = req.t('general:deletedCountSuccessfully', {
                count: result.docs.length,
                label: (0, getTranslation_1.getTranslation)(req.collection.config.labels[result.docs.length > 1 ? 'plural' : 'singular'], req.i18n),
            });
            return res.status(http_status_1.default.OK).json({
                ...(0, formatSuccess_1.default)(message, 'message'),
                ...result,
            });
        }
        const total = result.docs.length + result.errors.length;
        const message = req.t('error:unableToDeleteCount', {
            count: result.errors.length,
            total,
            label: (0, getTranslation_1.getTranslation)(req.collection.config.labels[total > 1 ? 'plural' : 'singular'], req.i18n),
        });
        return res.status(http_status_1.default.BAD_REQUEST).json({
            message,
            ...result,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = deleteHandler;
//# sourceMappingURL=delete.js.map