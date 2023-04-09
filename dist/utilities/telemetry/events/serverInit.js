"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverInit = void 0;
const __1 = require("..");
const serverInit = (payload) => {
    (0, __1.sendEvent)({
        payload,
        event: {
            type: 'server-init',
        },
    });
};
exports.serverInit = serverInit;
//# sourceMappingURL=serverInit.js.map