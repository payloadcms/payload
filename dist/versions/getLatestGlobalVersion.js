"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestGlobalVersion = void 0;
const types_1 = require("../types");
const getLatestGlobalVersion = async ({ payload, config, Model, query, lean = true, }) => {
    var _a;
    let latestVersion;
    if ((_a = config.versions) === null || _a === void 0 ? void 0 : _a.drafts) {
        latestVersion = await payload.versions[config.slug].findOne({}, {}, {
            sort: { updatedAt: 'desc' },
            lean,
        });
    }
    const global = await Model.findOne(query, {}, { lean });
    const globalExists = Boolean(global);
    if (!latestVersion || ((0, types_1.docHasTimestamps)(global) && latestVersion.updatedAt < global.updatedAt)) {
        return {
            global,
            globalExists,
        };
    }
    return {
        global: {
            ...latestVersion.version,
            updatedAt: latestVersion.updatedAt,
            createdAt: latestVersion.createdAt,
        },
        globalExists,
    };
};
exports.getLatestGlobalVersion = getLatestGlobalVersion;
//# sourceMappingURL=getLatestGlobalVersion.js.map