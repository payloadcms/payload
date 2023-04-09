"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const path_1 = __importDefault(require("path"));
const getExecuteStaticAccess_1 = __importDefault(require("../auth/getExecuteStaticAccess"));
const authenticate_1 = __importDefault(require("./middleware/authenticate"));
const corsHeaders_1 = __importDefault(require("./middleware/corsHeaders"));
function initStatic(ctx) {
    Object.entries(ctx.collections).forEach(([_, collection]) => {
        var _a;
        const { config } = collection;
        if (config.upload) {
            const router = express_1.default.Router();
            router.use((0, corsHeaders_1.default)(ctx.config));
            router.use(passport_1.default.initialize());
            router.use((0, authenticate_1.default)(ctx.config));
            router.use((0, getExecuteStaticAccess_1.default)(collection));
            if (Array.isArray((_a = config.upload) === null || _a === void 0 ? void 0 : _a.handlers)) {
                router.get('/:filename*', config.upload.handlers);
            }
            const staticPath = path_1.default.resolve(ctx.config.paths.configDir, config.upload.staticDir);
            router.use(express_1.default.static(staticPath, config.upload.staticOptions || {}));
            ctx.express.use(`${config.upload.staticURL}`, router);
        }
    });
}
exports.default = initStatic;
//# sourceMappingURL=static.js.map