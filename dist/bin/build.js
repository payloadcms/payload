"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
const webpack_1 = __importDefault(require("webpack"));
const getProdConfig_1 = __importDefault(require("../webpack/getProdConfig"));
const find_1 = __importDefault(require("../config/find"));
const load_1 = __importDefault(require("../config/load"));
const rawConfigPath = (0, find_1.default)();
const build = async () => {
    try {
        const config = await (0, load_1.default)();
        const webpackProdConfig = (0, getProdConfig_1.default)(config);
        (0, webpack_1.default)(webpackProdConfig, (err, stats) => {
            if (err || stats.hasErrors()) {
                // Handle errors here
                if (stats) {
                    console.error(stats.toString({
                        chunks: false,
                        colors: true,
                    }));
                }
                else {
                    console.error(err.message);
                }
            }
        });
    }
    catch (err) {
        console.error(err);
        throw new Error(`Error: can't find the configuration file located at ${rawConfigPath}.`);
    }
};
exports.build = build;
// when build.js is launched directly
if (module.id === require.main.id) {
    (0, exports.build)();
}
//# sourceMappingURL=build.js.map