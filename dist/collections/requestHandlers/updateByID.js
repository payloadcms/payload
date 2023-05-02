"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deprecatedUpdate = void 0;
const http_status_1 = __importDefault(require("http-status"));
const formatSuccess_1 = __importDefault(require("../../express/responses/formatSuccess"));
const updateByID_1 = __importDefault(require("../operations/updateByID"));
async function deprecatedUpdate(req, res, next) {
    req.payload.logger.warn('The PUT method is deprecated and will no longer be supported in a future release. Please use the PATCH method for update requests.');
    return updateByIDHandler(req, res, next);
}
exports.deprecatedUpdate = deprecatedUpdate;
async function updateByIDHandler(req, res, next) {
    try {
        const draft = req.query.draft === 'true';
        const autosave = req.query.autosave === 'true';
        const doc = await (0, updateByID_1.default)({
            req,
            collection: req.collection,
            id: req.params.id,
            data: req.body,
            depth: parseInt(String(req.query.depth), 10),
            draft,
            autosave,
        });
        let message = req.t('general:updatedSuccessfully');
        if (draft)
            message = req.t('version:draftSavedSuccessfully');
        if (autosave)
            message = req.t('version:autosavedSuccessfully');
        return res.status(http_status_1.default.OK).json({
            ...(0, formatSuccess_1.default)(message, 'message'),
            doc,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = updateByIDHandler;
//# sourceMappingURL=updateByID.js.map