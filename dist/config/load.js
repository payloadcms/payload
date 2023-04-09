"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
// eslint-disable-next-line import/no-extraneous-dependencies
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utilities/logger"));
const find_1 = __importDefault(require("./find"));
const validate_1 = __importDefault(require("./validate"));
const clientFiles_1 = require("./clientFiles");
const loadConfig = async (logger) => {
    const localLogger = logger !== null && logger !== void 0 ? logger : (0, logger_1.default)();
    const configPath = (0, find_1.default)();
    clientFiles_1.clientFiles.forEach((ext) => {
        require.extensions[ext] = () => null;
    });
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const configPromise = require(configPath);
    let config = await configPromise;
    if (config.default)
        config = await config.default;
    if (process.env.NODE_ENV !== 'production') {
        config = await (0, validate_1.default)(config, localLogger);
    }
    return {
        ...config,
        paths: {
            configDir: path_1.default.dirname(configPath),
            config: configPath,
            rawConfig: configPath,
        },
    };
};
exports.default = loadConfig;
//# sourceMappingURL=load.js.map