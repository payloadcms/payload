"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayloadVersion = exports.sendEvent = void 0;
const child_process_1 = require("child_process");
const conf_1 = __importDefault(require("conf"));
const crypto_1 = require("crypto");
const find_up_1 = __importDefault(require("find-up"));
const fs_1 = __importDefault(require("fs"));
const oneWayHash_1 = require("./oneWayHash");
const sendEvent = async ({ payload, event }) => {
    if (payload.config.telemetry !== false) {
        try {
            const packageJSON = await getPackageJSON();
            const baseEvent = {
                envID: getEnvID(),
                projectID: getProjectID(payload, packageJSON),
                nodeVersion: process.version,
                nodeEnv: process.env.NODE_ENV || 'development',
                payloadVersion: (0, exports.getPayloadVersion)(packageJSON),
            };
            await fetch('https://telemetry.payloadcms.com/events', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...baseEvent, ...event }),
            });
        }
        catch (_) {
            // Eat any errors in sending telemetry event
        }
    }
};
exports.sendEvent = sendEvent;
/**
 * This is a quasi-persistent identifier used to dedupe recurring events. It's
 * generated from random data and completely anonymous.
 */
const getEnvID = () => {
    const conf = new conf_1.default();
    const ENV_ID = 'envID';
    const val = conf.get(ENV_ID);
    if (val) {
        return val;
    }
    const generated = (0, crypto_1.randomBytes)(32).toString('hex');
    conf.set(ENV_ID, generated);
    return generated;
};
const getProjectID = (payload, packageJSON) => {
    const projectID = getGitID(payload) || getPackageJSONID(payload, packageJSON) || payload.config.serverURL || process.cwd();
    return (0, oneWayHash_1.oneWayHash)(projectID, payload.secret);
};
const getGitID = (payload) => {
    try {
        const originBuffer = (0, child_process_1.execSync)('git config --local --get remote.origin.url', {
            timeout: 1000,
            stdio: 'pipe',
        });
        return (0, oneWayHash_1.oneWayHash)(String(originBuffer).trim(), payload.secret);
    }
    catch (_) {
        return null;
    }
};
const getPackageJSON = async () => {
    const packageJsonPath = await (0, find_up_1.default)('package.json', { cwd: __dirname });
    const jsonContent = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
    return jsonContent;
};
const getPackageJSONID = (payload, packageJSON) => {
    return (0, oneWayHash_1.oneWayHash)(packageJSON.name, payload.secret);
};
const getPayloadVersion = (packageJSON) => {
    var _a, _b;
    return (_b = (_a = packageJSON === null || packageJSON === void 0 ? void 0 : packageJSON.dependencies) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : '';
};
exports.getPayloadVersion = getPayloadVersion;
//# sourceMappingURL=index.js.map