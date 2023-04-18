"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const connect_history_api_fallback_1 = __importDefault(require("connect-history-api-fallback"));
const init_1 = __importDefault(require("../webpack/init"));
const router = express_1.default.Router();
function initAdmin(ctx) {
    if (!ctx.config.admin.disable) {
        router.use((0, connect_history_api_fallback_1.default)());
        if (process.env.NODE_ENV === 'production') {
            router.get('*', (req, res, next) => {
                if (req.path.substr(-1) === '/' && req.path.length > 1) {
                    const query = req.url.slice(req.path.length);
                    res.redirect(301, req.path.slice(0, -1) + query);
                }
                else {
                    next();
                }
            });
            router.use((0, compression_1.default)(ctx.config.express.compression));
            router.use(express_1.default.static(ctx.config.admin.buildPath, { redirect: false }));
            ctx.express.use(ctx.config.routes.admin, router);
        }
        else {
            ctx.express.use(ctx.config.routes.admin, (0, connect_history_api_fallback_1.default)());
            ctx.express.use((0, init_1.default)(ctx.config));
        }
    }
}
exports.default = initAdmin;
//# sourceMappingURL=admin.js.map