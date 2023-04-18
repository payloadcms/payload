"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestCollectionVersion = void 0;
const types_1 = require("../types");
const getLatestCollectionVersion = async ({ payload, config, Model, query, id, lean = true, }) => {
    var _a;
    let latestVersion;
    if ((_a = config.versions) === null || _a === void 0 ? void 0 : _a.drafts) {
        latestVersion = await payload.versions[config.slug].findOne({
            parent: id,
        }, {}, {
            sort: { updatedAt: 'desc' },
            lean,
        });
    }
    const doc = await Model.findOne(query, {}, { lean });
    if (!latestVersion || ((0, types_1.docHasTimestamps)(doc) && latestVersion.updatedAt < doc.updatedAt)) {
        doc.id = doc._id;
        return doc;
    }
    return {
        ...latestVersion.version,
        id,
        updatedAt: latestVersion.updatedAt,
        createdAt: latestVersion.createdAt,
    };
};
exports.getLatestCollectionVersion = getLatestCollectionVersion;
//# sourceMappingURL=getLatestCollectionVersion.js.map