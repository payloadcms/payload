"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
const executeAccess = async (operation, access) => {
    if (access) {
        const result = await access(operation);
        if (!result) {
            if (!operation.disableErrors)
                throw new errors_1.Forbidden(operation.req.t);
        }
        return result;
    }
    if (operation.req.user) {
        return true;
    }
    if (!operation.disableErrors)
        throw new errors_1.Forbidden(operation.req.t);
    return false;
};
exports.default = executeAccess;
//# sourceMappingURL=executeAccess.js.map