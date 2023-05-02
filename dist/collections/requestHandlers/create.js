"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const formatSuccess_1 = __importDefault(require("../../express/responses/formatSuccess"));
const create_1 = __importDefault(require("../operations/create"));
const getTranslation_1 = require("../../utilities/getTranslation");
async function createHandler(req, res, next) {
    try {
        const autosave = req.query.autosave === 'true';
        const draft = req.query.draft === 'true';
        const doc = await (0, create_1.default)({
            req,
            collection: req.collection,
            data: req.body,
            depth: Number(req.query.depth),
            draft,
            autosave,
        });
        return res.status(http_status_1.default.CREATED).json({
            ...(0, formatSuccess_1.default)(req.t('general:successfullyCreated', { label: (0, getTranslation_1.getTranslation)(req.collection.config.labels.singular, req.i18n) }), 'message'),
            doc,
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = createHandler;
//# sourceMappingURL=create.js.map