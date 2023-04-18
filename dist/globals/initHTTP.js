"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mountEndpoints_1 = __importDefault(require("../express/mountEndpoints"));
const buildEndpoints_1 = __importDefault(require("./buildEndpoints"));
function initGlobals(ctx) {
    if (ctx.config.globals) {
        ctx.config.globals.forEach((global) => {
            const router = express_1.default.Router();
            const { slug } = global;
            const endpoints = (0, buildEndpoints_1.default)(global);
            (0, mountEndpoints_1.default)(ctx.express, router, endpoints);
            ctx.router.use(`/globals/${slug}`, router);
        });
    }
}
exports.default = initGlobals;
//# sourceMappingURL=initHTTP.js.map