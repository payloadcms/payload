// @ts-strict-ignore
import { hasWhereAccessResult } from '../../auth/index.js';
import { combineQueries } from '../../database/combineQueries.js';
import { docHasTimestamps } from '../../types/index.js';
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js';
import { appendVersionToQueryKey } from './appendVersionToQueryKey.js';
import { getQueryDraftsSelect } from './getQueryDraftsSelect.js';
export const replaceWithDraftIfAvailable = async ({ accessResult, doc, entity, entityType, req, select })=>{
    const { locale } = req;
    const queryToBuild = {
        and: [
            {
                'version._status': {
                    equals: 'draft'
                }
            }
        ]
    };
    if (entityType === 'collection') {
        queryToBuild.and.push({
            parent: {
                equals: doc.id
            }
        });
    }
    if (docHasTimestamps(doc)) {
        queryToBuild.and.push({
            or: [
                {
                    updatedAt: {
                        greater_than: doc.updatedAt
                    }
                },
                {
                    latest: {
                        equals: true
                    }
                }
            ]
        });
    }
    let versionAccessResult;
    if (hasWhereAccessResult(accessResult)) {
        versionAccessResult = appendVersionToQueryKey(accessResult);
    }
    const findVersionsArgs = {
        collection: entity.slug,
        global: entity.slug,
        limit: 1,
        locale: locale,
        pagination: false,
        req,
        select: getQueryDraftsSelect({
            select
        }),
        sort: '-updatedAt',
        where: combineQueries(queryToBuild, versionAccessResult)
    };
    let versionDocs;
    if (entityType === 'global') {
        versionDocs = (await req.payload.db.findGlobalVersions(findVersionsArgs)).docs;
    } else {
        versionDocs = (await req.payload.db.findVersions(findVersionsArgs)).docs;
    }
    let draft = versionDocs[0];
    if (!draft) {
        return doc;
    }
    draft = sanitizeInternalFields(draft);
    // Patch globalType onto version doc
    if (entityType === 'global' && 'globalType' in doc) {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        draft.version.globalType = doc.globalType;
    }
    // handle when .version wasn't selected due to projection
    if (!draft.version) {
        draft.version = {};
    }
    // Disregard all other draft content at this point,
    // Only interested in the version itself.
    // Operations will handle firing hooks, etc.
    draft.version.id = doc.id;
    return draft.version;
};

//# sourceMappingURL=replaceWithDraftIfAvailable.js.map