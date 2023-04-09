"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const formatSuccess_1 = __importDefault(require("../../express/responses/formatSuccess"));
const delete_1 = __importDefault(require("../operations/delete"));
async function deleteHandler(req, res, next) {
    try {
        await (0, delete_1.default)({
            req,
            user: req.user,
            key: req.params.key,
        });
        return res.status(http_status_1.default.OK).json({
            ...(0, formatSuccess_1.default)(req.t('deletedSuccessfully'), 'message'),
        });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = deleteHandler;
//# sourceMappingURL=delete.js.map