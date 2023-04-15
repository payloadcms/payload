"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCollectionVersion = void 0;
const enforceMaxVersions_1 = require("./enforceMaxVersions");
const sanitizeInternalFields_1 = __importDefault(require("../utilities/sanitizeInternalFields"));
const afterRead_1 = require("../fields/hooks/afterRead");
const saveCollectionVersion = async ({ payload, config, req, id, docWithLocales, }) => {
    var _a, _b;
    const VersionModel = payload.versions[config.slug];
    let version = docWithLocales;
    if ((_a = config.versions) === null || _a === void 0 ? void 0 : _a.drafts) {
        const latestVersion = await VersionModel.findOne({
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
        if (latestVersion) {
            // If the latest version is a draft, no need to re-save it
            // Example: when "promoting" a draft to published, the draft already exists.
            // Instead, return null
            if (((_b = latestVersion === null || latestVersion === void 0 ? void 0 : latestVersion.version) === null || _b === void 0 ? void 0 : _b._status) === 'draft') {
                return null;
            }
            version = latestVersion.version;
            version = JSON.parse(JSON.stringify(version));
            version = (0, sanitizeInternalFields_1.default)(version);
        }
    }
    version = await (0, afterRead_1.afterRead)({
        depth: 0,
        doc: version,
        entityConfig: config,
        req,
        overrideAccess: true,
        showHiddenFields: true,
        flattenLocales: false,
    });
    if (version._id)
        delete version._id;
    let createdVersion;
    try {
        createdVersion = await VersionModel.create({
            parent: id,
            version,
            autosave: false,
        });
    }
    catch (err) {
        payload.logger.error(`There was an error while saving a version for the ${config.labels.singular} with ID ${id}.`);
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
    if (createdVersion) {
        createdVersion = JSON.parse(JSON.stringify(createdVersion));
        createdVersion = (0, sanitizeInternalFields_1.default)(createdVersion);
    }
    return createdVersion;
};
exports.saveCollectionVersion = saveCollectionVersion;
//# sourceMappingURL=saveCollectionVersion.js.map