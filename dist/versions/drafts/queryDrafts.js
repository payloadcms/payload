"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryDrafts = void 0;
const auth_1 = require("../../auth");
const appendVersionToQueryKey_1 = require("./appendVersionToQueryKey");
const queryDrafts = async ({ accessResult, collection, locale, payload, paginationOptions, where: incomingWhere, }) => {
    var _a;
    const VersionModel = payload.versions[collection.config.slug];
    const where = (0, appendVersionToQueryKey_1.appendVersionToQueryKey)(incomingWhere || {});
    const versionQueryToBuild = {
        where: {
            ...where,
            and: [
                ...(where === null || where === void 0 ? void 0 : where.and) || [],
            ],
        },
    };
    if ((0, auth_1.hasWhereAccessResult)(accessResult)) {
        const versionAccessResult = (0, appendVersionToQueryKey_1.appendVersionToQueryKey)(accessResult);
        versionQueryToBuild.where.and.push(versionAccessResult);
    }
    const versionQuery = await VersionModel.buildQuery(versionQueryToBuild, locale);
    const aggregate = VersionModel.aggregate([
        // Sort so that newest are first
        { $sort: { updatedAt: -1 } },
        // Group by parent ID, and take the first of each
        {
            $group: {
                _id: '$parent',
                version: { $first: '$version' },
                updatedAt: { $first: '$updatedAt' },
                createdAt: { $first: '$createdAt' },
            },
        },
        // Filter based on incoming query
        { $match: versionQuery },
    ], {
        allowDiskUse: true,
    });
    let result;
    if (paginationOptions) {
        const aggregatePaginateOptions = {
            ...paginationOptions,
            useFacet: (_a = payload.mongoOptions) === null || _a === void 0 ? void 0 : _a.useFacet,
            sort: Object.entries(paginationOptions.sort)
                .reduce((sort, [incomingSortKey, order]) => {
                let key = incomingSortKey;
                if (!['createdAt', 'updatedAt', '_id'].includes(incomingSortKey)) {
                    key = `version.${incomingSortKey}`;
                }
                return {
                    ...sort,
                    [key]: order === 'asc' ? 1 : -1,
                };
            }, {}),
        };
        result = await VersionModel.aggregatePaginate(aggregate, aggregatePaginateOptions);
    }
    else {
        result = aggregate.exec();
    }
    return {
        ...result,
        docs: result.docs.map((doc) => ({
            _id: doc._id,
            ...doc.version,
            updatedAt: doc.updatedAt,
            createdAt: doc.createdAt,
        })),
    };
};
exports.queryDrafts = queryDrafts;
//# sourceMappingURL=queryDrafts.js.map