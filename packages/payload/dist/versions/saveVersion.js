import { deepCopyObjectSimple } from '../index.js';
import { getVersionsMax } from '../utilities/getVersionsConfig.js';
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js';
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js';
import { enforceMaxVersions } from './enforceMaxVersions.js';
import { saveSnapshot } from './saveSnapshot.js';
export async function saveVersion({ id, autosave, collection, docWithLocales, draft, global, operation, payload, publishSpecificLocale, req, returning, select, snapshot }) {
    let result;
    let createNewVersion = true;
    const now = new Date().toISOString();
    const versionData = deepCopyObjectSimple(docWithLocales);
    if (draft) {
        versionData._status = 'draft';
    }
    if (collection?.timestamps && draft) {
        versionData.updatedAt = now;
    }
    if (versionData._id) {
        delete versionData._id;
    }
    try {
        if (autosave) {
            let docs;
            const findVersionArgs = {
                limit: 1,
                pagination: false,
                req,
                sort: '-updatedAt'
            };
            if (collection) {
                ;
                ({ docs } = await payload.db.findVersions({
                    ...findVersionArgs,
                    collection: collection.slug,
                    limit: 1,
                    pagination: false,
                    req,
                    where: {
                        parent: {
                            equals: id
                        }
                    }
                }));
            } else {
                ;
                ({ docs } = await payload.db.findGlobalVersions({
                    ...findVersionArgs,
                    global: global.slug,
                    limit: 1,
                    pagination: false,
                    req
                }));
            }
            const [latestVersion] = docs;
            // overwrite the latest version if it's set to autosave
            if (latestVersion && 'autosave' in latestVersion && latestVersion.autosave === true) {
                createNewVersion = false;
                const updateVersionArgs = {
                    id: latestVersion.id,
                    req,
                    versionData: {
                        createdAt: new Date(latestVersion.createdAt).toISOString(),
                        latest: true,
                        parent: id,
                        updatedAt: now,
                        version: {
                            ...versionData
                        }
                    }
                };
                if (collection) {
                    result = await payload.db.updateVersion({
                        ...updateVersionArgs,
                        collection: collection.slug,
                        req
                    });
                } else {
                    result = await payload.db.updateGlobalVersion({
                        ...updateVersionArgs,
                        global: global.slug,
                        req
                    });
                }
            }
        }
        if (createNewVersion) {
            const createVersionArgs = {
                autosave: Boolean(autosave),
                collectionSlug: undefined,
                createdAt: operation === 'restoreVersion' ? versionData.createdAt : now,
                globalSlug: undefined,
                parent: collection ? id : undefined,
                publishedLocale: publishSpecificLocale || undefined,
                req,
                returning,
                select: getQueryDraftsSelect({
                    select
                }),
                updatedAt: now,
                versionData
            };
            if (collection) {
                createVersionArgs.collectionSlug = collection.slug;
                result = await payload.db.createVersion(createVersionArgs);
            }
            if (global) {
                createVersionArgs.globalSlug = global.slug;
                result = await payload.db.createGlobalVersion(createVersionArgs);
            }
            if (snapshot) {
                await saveSnapshot({
                    id,
                    autosave,
                    collection,
                    data: snapshot,
                    global,
                    payload,
                    publishSpecificLocale,
                    req,
                    select
                });
            }
        }
    } catch (err) {
        let errorMessage;
        if (collection) {
            errorMessage = `There was an error while saving a version for the ${typeof collection.labels.singular === 'string' ? collection.labels.singular : collection.slug} with ID ${id}.`;
        }
        if (global) {
            errorMessage = `There was an error while saving a version for the global ${typeof global.label === 'string' ? global.label : global.slug}.`;
        }
        payload.logger.error({
            err,
            msg: errorMessage
        });
        return undefined;
    }
    const max = getVersionsMax(collection || global);
    if (createNewVersion && max > 0) {
        await enforceMaxVersions({
            id,
            collection,
            global,
            max,
            payload,
            req
        });
    }
    if (returning === false) {
        return null;
    }
    let createdVersion = result.version;
    createdVersion = sanitizeInternalFields(createdVersion);
    createdVersion.id = result.parent;
    return createdVersion;
}

//# sourceMappingURL=saveVersion.js.map