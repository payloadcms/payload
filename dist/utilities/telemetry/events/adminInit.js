"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminInit = void 0;
const __1 = require("..");
const oneWayHash_1 = require("../oneWayHash");
const adminInit = (req) => {
    const { user, payload } = req;
    const { host } = req.headers;
    let domainID;
    let userID;
    if (host) {
        domainID = (0, oneWayHash_1.oneWayHash)(host, payload.secret);
    }
    if (user && typeof (user === null || user === void 0 ? void 0 : user.id) === 'string') {
        userID = (0, oneWayHash_1.oneWayHash)(user.id, payload.secret);
    }
    (0, __1.sendEvent)({
        payload,
        event: {
            type: 'admin-init',
            domainID,
            userID,
        },
    });
};
exports.adminInit = adminInit;
//# sourceMappingURL=adminInit.js.map