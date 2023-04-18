"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mountEndpoints(express, router, endpoints) {
    endpoints.forEach((endpoint) => {
        if (!endpoint.root) {
            router[endpoint.method](endpoint.path, endpoint.handler);
        }
        else {
            express[endpoint.method](endpoint.path, endpoint.handler);
        }
    });
}
exports.default = mountEndpoints;
//# sourceMappingURL=mountEndpoints.js.map