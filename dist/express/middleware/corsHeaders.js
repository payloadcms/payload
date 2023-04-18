"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (config) => ((req, res, next) => {
    if (config.cors) {
        res.header('Access-Control-Allow-Methods', 'PUT, PATCH, POST, GET, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Encoding, x-apollo-tracing');
        if (config.cors === '*') {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
        else if (Array.isArray(config.cors) && config.cors.indexOf(req.headers.origin) > -1) {
            res.header('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        }
    }
    next();
});
//# sourceMappingURL=corsHeaders.js.map