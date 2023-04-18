"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oneWayHash = void 0;
const crypto_1 = require("crypto");
const oneWayHash = (data, secret) => {
    const hash = (0, crypto_1.createHash)('sha256');
    // prepend value with payload secret. This ensure one-way.
    hash.update(secret);
    // Update is an append operation, not a replacement. The secret from the prior
    // update is still present!
    hash.update(data);
    return hash.digest('hex');
};
exports.oneWayHash = oneWayHash;
//# sourceMappingURL=oneWayHash.js.map