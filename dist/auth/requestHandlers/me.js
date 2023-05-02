"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const me_1 = __importDefault(require("../operations/me"));
async function meHandler(req, res, next) {
    try {
        const response = await (0, me_1.default)({
            req,
            collection: req.collection,
        });
        return res.status(200).json(response);
    }
    catch (err) {
        return next(err);
    }
}
exports.default = meHandler;
//# sourceMappingURL=me.js.map