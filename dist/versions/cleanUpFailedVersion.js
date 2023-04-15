"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cleanUpFailedVersion = (args) => {
    const { payload, entityConfig, version } = args;
    if (version) {
        const VersionModel = payload.versions[entityConfig.slug];
        VersionModel.findOneAndDelete({ _id: version.id });
    }
};
exports.default = cleanUpFailedVersion;
//# sourceMappingURL=cleanUpFailedVersion.js.map