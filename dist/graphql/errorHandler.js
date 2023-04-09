"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * @param info
 * @param debug
 * @param afterErrorHook
 * @returns {Promise<unknown[]>}
 */
const errorHandler = async (payload, info, debug, afterErrorHook) => Promise.all(info.result.errors.map(async (err) => {
    var _a;
    payload.logger.error(err.stack);
    let response = {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: {
            name: ((_a = err === null || err === void 0 ? void 0 : err.originalError) === null || _a === void 0 ? void 0 : _a.name) || undefined,
            data: (err && err.originalError && err.originalError.data) || undefined,
            stack: debug ? err.stack : undefined,
        },
    };
    if (afterErrorHook) {
        ({ response } = await afterErrorHook(err, response) || { response });
    }
    return response;
}));
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map