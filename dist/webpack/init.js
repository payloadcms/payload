"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = __importDefault(require("webpack"));
const express_1 = __importDefault(require("express"));
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const webpack_hot_middleware_1 = __importDefault(require("webpack-hot-middleware"));
const getDevConfig_1 = __importDefault(require("./getDevConfig"));
const router = express_1.default.Router();
function initWebpack(config) {
    const webpackDevConfig = (0, getDevConfig_1.default)(config);
    const compiler = (0, webpack_1.default)(webpackDevConfig);
    router.use((0, webpack_dev_middleware_1.default)(compiler, {
        publicPath: webpackDevConfig.output.publicPath,
    }));
    router.use((0, webpack_hot_middleware_1.default)(compiler));
    return router;
}
exports.default = initWebpack;
//# sourceMappingURL=init.js.map