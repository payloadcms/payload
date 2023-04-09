"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findByID_1 = __importDefault(require("../operations/findByID"));
async function findByIDHandler(req, res, next) {
    try {
        const doc = await (0, findByID_1.default)({
            req,
            collection: req.collection,
            id: req.params.id,
            depth: Number(req.query.depth),
            draft: req.query.draft === 'true',
        });
        return res.json(doc);
    }
    catch (error) {
        return next(error);
    }
}
exports.default = findByIDHandler;
//# sourceMappingURL=findByID.js.map