"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePublishedCollectionVersion = void 0;
const enforceMaxVersions_1 = require("./enforceMaxVersions");
const afterRead_1 = require("../fields/hooks/afterRead");
const ensurePublishedCollectionVersion = async ({ payload, config, req, id, docWithLocales, }) => {
    // If there are no newer drafts,
    // And the current doc is published,
    // We need to keep a version of the published document
    if ((docWithLocales === null || docWithLocales === void 0 ? void 0 : docWithLocales._status) === 'published') {
        const VersionModel = payload.versions[config.slug];
        const moreRecentDrafts = await VersionModel.find({
            parent: {
                $eq: docWithLocales.id,
            },
            updatedAt: {
                $gt: docWithLocales.updatedAt,
            },
        }, {}, {
            lean: true,
            leanWithId: true,
            sort: {
                updatedAt: 'desc',
            },
        });
        if ((moreRecentDrafts === null || moreRecentDrafts === void 0 ? void 0 : moreRecentDrafts.length) === 0) {
            const version = await (0, afterRead_1.afterRead)({
                depth: 0,
                doc: docWithLocales,
                entityConfig: config,
                req,
                overrideAccess: true,
                showHiddenFields: true,
                flattenLocales: false,
            });
            try {
                await VersionModel.create({
                    parent: id,
                    version,
                    autosave: false,
                });
            }
            catch (err) {
                payload.logger.error(`There was an error while saving a version for the ${config.slug} with ID ${id}.`);
                payload.logger.error(err);
            }
            if (config.versions.maxPerDoc) {
                (0, enforceMaxVersions_1.enforceMaxVersions)({
                    id,
                    payload,
                    Model: VersionModel,
                    slug: config.slug,
                    entityType: 'collection',
                    max: config.versions.maxPerDoc,
                });
            }
        }
    }
};
exports.ensurePublishedCollectionVersion = ensurePublishedCollectionVersion;
//# sourceMappingURL=ensurePublishedCollectionVersion.js.map