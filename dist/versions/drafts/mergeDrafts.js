"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDrafts = void 0;
const auth_1 = require("../../auth");
const appendVersionToQueryKey_1 = require("./appendVersionToQueryKey");
const replaceWithDraftIfAvailable_1 = __importDefault(require("./replaceWithDraftIfAvailable"));
const mergeDrafts = async ({ accessResult, collection, locale, payload, paginationOptions, query, where: incomingWhere, }) => {
    // Query the main collection for any IDs that match the query
    // Create object "map" for performant lookup
    const mainCollectionMatchMap = await collection.Model.find(query, { updatedAt: 1 }, { limit: paginationOptions.limit, sort: paginationOptions.sort })
        .lean().then((res) => res.reduce((map, { _id, updatedAt }) => {
        const newMap = map;
        newMap[_id] = updatedAt;
        return newMap;
    }, {}));
    // Query the versions collection with a version-specific query
    const VersionModel = payload.versions[collection.config.slug];
    const where = (0, appendVersionToQueryKey_1.appendVersionToQueryKey)(incomingWhere || {});
    const versionQueryToBuild = {
        where: {
            ...where,
            and: [
                ...(where === null || where === void 0 ? void 0 : where.and) || [],
                {
                    'version._status': {
                        equals: 'draft',
                    },
                },
            ],
        },
    };
    if ((0, auth_1.hasWhereAccessResult)(accessResult)) {
        const versionAccessResult = (0, appendVersionToQueryKey_1.appendVersionToQueryKey)(accessResult);
        versionQueryToBuild.where.and.push(versionAccessResult);
    }
    const versionQuery = await VersionModel.buildQuery(versionQueryToBuild, locale);
    const includedParentIDs = [];
    // Create version "map" for performant lookup
    // and in the same loop, check if there are matched versions without a matched parent
    // This means that the newer version's parent should appear in the main query.
    // To do so, add the version's parent ID into an explicit `includedIDs` array
    const versionCollectionMatchMap = await VersionModel.aggregate([
        {
            $sort: Object.entries(paginationOptions.sort).reduce((sort, [key, order]) => {
                return {
                    ...sort,
                    [key]: order === 'asc' ? 1 : -1,
                };
            }, {}),
        },
        {
            $group: {
                _id: '$parent',
                versionID: { $first: '$_id' },
                version: { $first: '$version' },
                updatedAt: { $first: '$updatedAt' },
                createdAt: { $first: '$createdAt' },
            },
        },
        {
            $addFields: {
                id: {
                    $toObjectId: '$_id',
                },
            },
        },
        {
            $lookup: {
                from: collection.config.slug,
                localField: 'id',
                foreignField: '_id',
                as: 'parent',
            },
        },
        {
            $match: {
                parent: {
                    $size: 1,
                },
            },
        },
        { $match: versionQuery },
        { $limit: paginationOptions.limit },
    ]).then((res) => res.reduce((map, { _id, updatedAt, createdAt, version }) => {
        const newMap = map;
        newMap[_id] = { version, updatedAt, createdAt };
        const matchedParent = mainCollectionMatchMap[_id];
        if (!matchedParent)
            includedParentIDs.push(_id);
        return newMap;
    }, {}));
    // Now we need to explicitly exclude any parent matches that have newer versions
    // which did NOT appear in the versions query
    const excludedParentIDs = await Promise.all(Object.entries(mainCollectionMatchMap).map(async ([parentDocID, parentDocUpdatedAt]) => {
        // If there is a matched version, and it's newer, this parent should remain
        if (versionCollectionMatchMap[parentDocID] && versionCollectionMatchMap[parentDocID].updatedAt > parentDocUpdatedAt) {
            return null;
        }
        // Otherwise, we need to check if there are newer versions present
        // that did not get returned from the versions query
        const versionsQuery = await VersionModel.find({
            updatedAt: {
                $gt: parentDocUpdatedAt,
            },
            parent: {
                $eq: parentDocID,
            },
        }, {}, { limit: 1 }).lean();
        // If there are,
        // this says that the newest version does not match the incoming query,
        // and the parent ID should be excluded
        if (versionsQuery.length > 0) {
            return parentDocID;
        }
        return null;
    })).then((res) => res.filter((result) => Boolean(result)));
    // Run a final query against the main collection,
    // passing in any ids to exclude and include
    // so that they appear properly paginated
    const finalQueryToBuild = {
        where: {
            and: [],
        },
    };
    finalQueryToBuild.where.and.push({ or: [] });
    if ((0, auth_1.hasWhereAccessResult)(accessResult)) {
        finalQueryToBuild.where.and.push(accessResult);
    }
    if (incomingWhere) {
        finalQueryToBuild.where.and[0].or.push(incomingWhere);
    }
    if (includedParentIDs.length > 0) {
        finalQueryToBuild.where.and[0].or.push({
            id: {
                in: includedParentIDs,
            },
        });
    }
    if (excludedParentIDs.length > 0) {
        finalQueryToBuild.where.and.push({
            id: {
                not_in: excludedParentIDs,
            },
        });
    }
    const finalQuery = await collection.Model.buildQuery(finalQueryToBuild, locale);
    let result = await collection.Model.paginate(finalQuery, paginationOptions);
    result = {
        ...result,
        docs: await Promise.all(result.docs.map(async (doc) => {
            const matchedVersion = versionCollectionMatchMap[doc.id];
            if (matchedVersion && matchedVersion.updatedAt > doc.updatedAt) {
                return {
                    ...doc,
                    ...matchedVersion.version,
                    createdAt: matchedVersion.createdAt,
                    updatedAt: matchedVersion.updatedAt,
                };
            }
            return (0, replaceWithDraftIfAvailable_1.default)({
                accessResult,
                payload,
                entity: collection.config,
                entityType: 'collection',
                doc,
                locale,
            });
        })),
    };
    return result;
};
exports.mergeDrafts = mergeDrafts;
//# sourceMappingURL=mergeDrafts.js.map