"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const registerFirstUser_1 = __importDefault(require("../operations/registerFirstUser"));
async function registerFirstUserHandler(req, res, next) {
    try {
        const firstUser = await (0, registerFirstUser_1.default)({
            req,
            res,
            collection: req.collection,
            data: req.body,
        });
        return res.status(201).json(firstUser);
    }
    catch (error) {
        return next(error);
    }
}
exports.default = registerFirstUserHandler;
//# sourceMappingURL=registerFirstUser.js.map