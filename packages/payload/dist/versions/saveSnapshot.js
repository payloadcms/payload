import { deepCopyObjectSimple } from '../index.js';
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js';
export const saveSnapshot = async ({ id, autosave, collection, data, global, payload, publishSpecificLocale, req, select })=>{
    const docData = deepCopyObjectSimple(data || {});
    docData._status = 'draft';
    if (docData._id) {
        delete docData._id;
    }
    const snapshotDate = new Date().toISOString();
    const sharedCreateVersionArgs = {
        autosave: Boolean(autosave),
        createdAt: snapshotDate,
        publishedLocale: publishSpecificLocale || undefined,
        req,
        returning: false,
        select: getQueryDraftsSelect({
            select
        }),
        updatedAt: snapshotDate,
        versionData: docData
    };
    if (collection && id) {
        return payload.db.createVersion({
            ...sharedCreateVersionArgs,
            collectionSlug: collection.slug,
            parent: id,
            snapshot: true
        });
    }
    if (global) {
        return payload.db.createGlobalVersion({
            ...sharedCreateVersionArgs,
            globalSlug: global.slug,
            snapshot: true
        });
    }
};

//# sourceMappingURL=saveSnapshot.js.map