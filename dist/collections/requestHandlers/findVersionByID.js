"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findVersionByID_1 = __importDefault(require("../operations/findVersionByID"));
async function findVersionByIDHandler(req, res, next) {
    const options = {
        req,
        collection: req.collection,
        id: req.params.id,
        payload: req.payload,
        depth: parseInt(String(req.query.depth), 10),
    };
    try {
        const doc = await (0, findVersionByID_1.default)(options);
        return res.json(doc);
    }
    catch (error) {
        return next(error);
    }
}
exports.default = findVersionByIDHandler;
//# sourceMappingURL=findVersionByID.js.map