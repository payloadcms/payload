"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payload = exports.getPayload = void 0;
const initHTTP_1 = require("./initHTTP");
const payload_1 = require("./payload");
var payload_2 = require("./payload");
Object.defineProperty(exports, "getPayload", { enumerable: true, get: function () { return payload_2.getPayload; } });
require('isomorphic-fetch');
class Payload extends payload_1.BasePayload {
    async init(options) {
        const payload = await (0, initHTTP_1.initHTTP)(options);
        Object.assign(this, payload);
        if (!options.local) {
            if (typeof options.onInit === 'function')
                await options.onInit(this);
            if (typeof this.config.onInit === 'function')
                await this.config.onInit(this);
        }
        return payload;
    }
}
exports.Payload = Payload;
const payload = new Payload();
exports.default = payload;
module.exports = payload;
//# sourceMappingURL=index.js.map