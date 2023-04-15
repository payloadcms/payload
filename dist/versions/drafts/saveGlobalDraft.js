"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveGlobalDraft = void 0;
const enforceMaxVersions_1 = require("../enforceMaxVersions");
const saveGlobalDraft = async ({ payload, config, data, autosave, }) => {
    const VersionsModel = payload.versions[config.slug];
    const dataAsDraft = { ...data, _status: 'draft' };
    let existingAutosaveVersion;
    if (autosave) {
        existingAutosaveVersion = await VersionsModel.findOne();
    }
    let result;
    try {
        // If there is an existing autosave document,
        // Update it
        if (autosave && (existingAutosaveVersion === null || existingAutosaveVersion === void 0 ? void 0 : existingAutosaveVersion.autosave) === true) {
            result = await VersionsModel.findByIdAndUpdate({
                _id: existingAutosaveVersion._id,
            }, {
                version: dataAsDraft,
            }, { new: true, lean: true });
            // Otherwise, create a new one
        }
        else {
            result = await VersionsModel.create({
                version: dataAsDraft,
                autosave: Boolean(autosave),
            });
        }
    }
    catch (err) {
        payload.logger.error(`There was an error while saving a draft for the Global ${config.slug}.`);
        payload.logger.error(err);
    }
    if (config.versions.max) {
        (0, enforceMaxVersions_1.enforceMaxVersions)({
            payload: this,
            Model: VersionsModel,
            slug: config.slug,
            entityType: 'global',
            max: config.versions.max,
        });
    }
    result = result.version;
    result = JSON.stringify(result);
    result = JSON.parse(result);
    return result;
};
exports.saveGlobalDraft = saveGlobalDraft;
//# sourceMappingURL=saveGlobalDraft.js.map