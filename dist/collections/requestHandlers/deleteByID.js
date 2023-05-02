"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../../errors");
const deleteByID_1 = __importDefault(require("../operations/deleteByID"));
async function deleteByIDHandler(req, res, next) {
    try {
        const doc = await (0, deleteByID_1.default)({
            req,
            collection: req.collection,
            id: req.params.id,
            depth: parseInt(String(req.query.depth), 10),
        });
        if (!doc) {
            return res.status(http_status_1.default.NOT_FOUND).json(new errors_1.NotFound(req.t));
        }
        return res.status(http_status_1.default.OK).send(doc);
    }
    catch (error) {
        return next(error);
    }
}
exports.default = deleteByIDHandler;
//# sourceMappingURL=deleteByID.js.map