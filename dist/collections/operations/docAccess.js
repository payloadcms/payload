"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docAccess = void 0;
const getEntityPolicies_1 = require("../../utilities/getEntityPolicies");
const allOperations = ['create', 'read', 'update', 'delete'];
async function docAccess(args) {
    const { id, req, req: { collection: { config, }, }, } = args;
    const collectionOperations = [...allOperations];
    if (config.auth && (typeof config.auth.maxLoginAttempts !== 'undefined' && config.auth.maxLoginAttempts !== 0)) {
        collectionOperations.push('unlock');
    }
    if (config.versions) {
        collectionOperations.push('readVersions');
    }
    const [policy, promises] = (0, getEntityPolicies_1.getEntityPolicies)({
        type: 'collection',
        req,
        entity: config,
        operations: collectionOperations,
        id,
    });
    await Promise.all(promises);
    return policy;
}
exports.docAccess = docAccess;
//# sourceMappingURL=docAccess.js.map