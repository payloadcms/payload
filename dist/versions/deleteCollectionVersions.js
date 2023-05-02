"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollectionVersions = void 0;
const deleteCollectionVersions = async ({ payload, slug, id, }) => {
    const VersionsModel = payload.versions[slug];
    try {
        await VersionsModel.deleteMany({
            parent: {
                $eq: id,
            },
        });
    }
    catch (err) {
        payload.logger.error(`There was an error removing versions for the deleted ${slug} document with ID ${id}.`);
    }
};
exports.deleteCollectionVersions = deleteCollectionVersions;
//# sourceMappingURL=deleteCollectionVersions.js.map