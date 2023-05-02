"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceMaxVersions = void 0;
const enforceMaxVersions = async ({ payload, Model, max, slug, entityType, id, }) => {
    var _a;
    try {
        const query = {};
        if (entityType === 'collection')
            query.parent = id;
        const oldestAllowedDoc = await Model.find(query).limit(1).skip(max).sort({ updatedAt: -1 });
        if ((_a = oldestAllowedDoc === null || oldestAllowedDoc === void 0 ? void 0 : oldestAllowedDoc[0]) === null || _a === void 0 ? void 0 : _a.updatedAt) {
            const deleteQuery = {
                updatedAt: {
                    $lte: oldestAllowedDoc[0].updatedAt,
                },
            };
            if (entityType === 'collection')
                deleteQuery.parent = id;
            await Model.deleteMany(deleteQuery);
        }
    }
    catch (err) {
        payload.logger.error(`There was an error cleaning up old versions for the ${entityType} ${slug}`);
    }
};
exports.enforceMaxVersions = enforceMaxVersions;
//# sourceMappingURL=enforceMaxVersions.js.map