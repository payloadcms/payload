"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const find_up_1 = __importDefault(require("find-up"));
const findConfig = () => {
    // If the developer has specified a config path,
    // format it if relative and use it directly if absolute
    if (process.env.PAYLOAD_CONFIG_PATH) {
        if (path_1.default.isAbsolute(process.env.PAYLOAD_CONFIG_PATH)) {
            return process.env.PAYLOAD_CONFIG_PATH;
        }
        return path_1.default.resolve(process.cwd(), process.env.PAYLOAD_CONFIG_PATH);
    }
    const configPath = find_up_1.default.sync((dir) => {
        const tsPath = path_1.default.join(dir, 'payload.config.ts');
        const hasTS = find_up_1.default.sync.exists(tsPath);
        if (hasTS)
            return tsPath;
        const jsPath = path_1.default.join(dir, 'payload.config.js');
        const hasJS = find_up_1.default.sync.exists(jsPath);
        if (hasJS)
            return jsPath;
        return undefined;
    });
    if (configPath)
        return configPath;
    throw new Error('Error: cannot find Payload config. Please create a configuration file located at the root of your current working directory called "payload.config.js" or "payload.config.ts".');
};
exports.default = findConfig;
//# sourceMappingURL=find.js.map