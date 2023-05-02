"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docAccess = void 0;
const getEntityPolicies_1 = require("../../utilities/getEntityPolicies");
async function docAccess(args) {
    const { req, globalConfig, } = args;
    const globalOperations = ['read', 'update'];
    if (globalConfig.versions) {
        globalOperations.push('readVersions');
    }
    const [policy, promises] = (0, getEntityPolicies_1.getEntityPolicies)({
        type: 'global',
        req,
        entity: globalConfig,
        operations: globalOperations,
    });
    await Promise.all(promises);
    return policy;
}
exports.docAccess = docAccess;
//# sourceMappingURL=docAccess.js.map