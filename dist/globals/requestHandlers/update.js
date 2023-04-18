"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const update_1 = __importDefault(require("../operations/update"));
function updateHandler(globalConfig) {
    return async function handler(req, res, next) {
        try {
            const { slug } = globalConfig;
            const draft = req.query.draft === 'true';
            const autosave = req.query.autosave === 'true';
            const result = await (0, update_1.default)({
                req,
                globalConfig,
                slug,
                depth: Number(req.query.depth),
                data: req.body,
                draft,
                autosave,
            });
            let message = req.t('general:updatedSuccessfully');
            if (draft)
                message = req.t('version:draftSavedSuccessfully');
            if (autosave)
                message = req.t('version:autosavedSuccessfully');
            return res.status(http_status_1.default.OK).json({ message, result });
        }
        catch (error) {
            return next(error);
        }
    };
}
exports.default = updateHandler;
//# sourceMappingURL=update.js.map