"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTransportOptions = exports.hasTransport = void 0;
/**
 * type guard for EmailOptions
 * @param emailConfig
 */
function hasTransport(emailConfig) {
    return emailConfig.transport !== undefined;
}
exports.hasTransport = hasTransport;
/**
 * type guard for EmailOptions
 * @param emailConfig
 */
function hasTransportOptions(emailConfig) {
    return emailConfig.transportOptions !== undefined;
}
exports.hasTransportOptions = hasTransportOptions;
//# sourceMappingURL=types.js.map