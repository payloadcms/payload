"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isNumber_1 = require("../../utilities/isNumber");
const findVersionByID_1 = __importDefault(require("../operations/findVersionByID"));
function findVersionByIDHandler(globalConfig) {
    return async function handler(req, res, next) {
        var _a;
        const options = {
            req,
            globalConfig,
            id: req.params.id,
            depth: (0, isNumber_1.isNumber)((_a = req.query) === null || _a === void 0 ? void 0 : _a.depth) ? Number(req.query.depth) : undefined,
        };
        try {
            const doc = await (0, findVersionByID_1.default)(options);
            return res.json(doc);
        }
        catch (error) {
            return next(error);
        }
    };
}
exports.default = findVersionByIDHandler;
//# sourceMappingURL=findVersionByID.js.map