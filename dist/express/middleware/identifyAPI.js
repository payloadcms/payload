"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identifyAPI = (api) => {
    return (req, _, next) => {
        req.payloadAPI = api;
        next();
    };
};
exports.default = identifyAPI;
//# sourceMappingURL=identifyAPI.js.map