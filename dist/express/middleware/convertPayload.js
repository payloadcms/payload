"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (req, _, next) => {
    var _a, _b;
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a._payload) {
        const payloadJSON = JSON.parse(req.body._payload);
        req.body = {
            ...req.body,
            ...payloadJSON,
        };
        (_b = req.body) === null || _b === void 0 ? true : delete _b._payload;
    }
    next();
};
//# sourceMappingURL=convertPayload.js.map