"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePublishedGlobalVersion = void 0;
const enforceMaxVersions_1 = require("./enforceMaxVersions");
const afterRead_1 = require("../fields/hooks/afterRead");
const ensurePublishedGlobalVersion = async ({ payload, config, req, docWithLocales, }) => {
    // If there are no newer drafts,
    // And the current doc is published,
    // We need to keep a version of the published document
    if ((docWithLocales === null || docWithLocales === void 0 ? void 0 : docWithLocales._status) === 'published') {
        const VersionModel = payload.versions[config.slug];
        const moreRecentDrafts = await VersionModel.find({
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
                    version,
                    autosave: false,
                });
            }
            catch (err) {
                payload.logger.error(`There was an error while saving a version for the Global ${config.label}.`);
                payload.logger.error(err);
            }
            if (config.versions.max) {
                (0, enforceMaxVersions_1.enforceMaxVersions)({
                    payload: this,
                    Model: VersionModel,
                    slug: config.slug,
                    entityType: 'global',
                    max: config.versions.max,
                });
            }
        }
    }
};
exports.ensurePublishedGlobalVersion = ensurePublishedGlobalVersion;
//# sourceMappingURL=ensurePublishedGlobalVersion.js.map