"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const defaultLoggerOptions = {
    prettyPrint: {
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss',
    },
};
const getLogger = (name = 'payload', options) => (0, pino_1.default)({
    name: (options === null || options === void 0 ? void 0 : options.name) || name,
    enabled: process.env.DISABLE_LOGGING !== 'true',
    ...(options || defaultLoggerOptions),
});
exports.default = getLogger;
//# sourceMappingURL=logger.js.map