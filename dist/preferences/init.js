"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const findOne_1 = __importDefault(require("./requestHandlers/findOne"));
const update_1 = __importDefault(require("./requestHandlers/update"));
const delete_1 = __importDefault(require("./requestHandlers/delete"));
function initPreferences(ctx) {
    if (!ctx.local) {
        const router = express_1.default.Router();
        router
            .route('/_preferences/:key')
            .get(findOne_1.default)
            .post(update_1.default)
            .delete(delete_1.default);
        ctx.router.use(router);
    }
}
exports.default = initPreferences;
//# sourceMappingURL=init.js.map