"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = __importDefault(require("../operations/init"));
async function initHandler(req, res, next) {
    try {
        const initialized = await (0, init_1.default)({ Model: req.collection.Model, req });
        return res.status(200).json({ initialized });
    }
    catch (error) {
        return next(error);
    }
}
exports.default = initHandler;
//# sourceMappingURL=init.js.map