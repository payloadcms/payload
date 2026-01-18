import { flattenWhereToOperators } from 'payload';
import { buildQuery } from './queries/buildQuery.js';
import { buildSortParam } from './queries/buildSortParam.js';
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js';
import { getCollection } from './utilities/getEntity.js';
import { getSession } from './utilities/getSession.js';
import { handleError } from './utilities/handleError.js';
import { transform } from './utilities/transform.js';
export const updateMany = async function updateMany({ collection: collectionSlug, data, limit, locale, options: optionsArgs = {}, req, returning, select, sort: sortArg, where }) {
    let hasNearConstraint = false;
    if (where) {
        const constraints = flattenWhereToOperators(where);
        hasNearConstraint = constraints.some((prop)=>Object.keys(prop).some((key)=>key === 'near'));
    }
    const { collectionConfig, Model } = getCollection({
        adapter: this,
        collectionSlug
    });
    let sort;
    if (!hasNearConstraint) {
        sort = buildSortParam({
            adapter: this,
            config: this.payload.config,
            fields: collectionConfig.flattenedFields,
            locale,
            sort: sortArg || collectionConfig.defaultSort,
            timestamps: true
        });
    }
    let query = await buildQuery({
        adapter: this,
        collectionSlug,
        fields: collectionConfig.flattenedFields,
        locale,
        where
    });
    const $inc = {};
    const $push = {};
    const $addToSet = {};
    const $pull = {};
    transform({
        $addToSet,
        $inc,
        $pull,
        $push,
        adapter: this,
        data,
        fields: collectionConfig.fields,
        operation: 'write'
    });
    const updateOps = {};
    if (Object.keys($inc).length) {
        updateOps.$inc = $inc;
    }
    if (Object.keys($push).length) {
        updateOps.$push = $push;
    }
    if (Object.keys($addToSet).length) {
        updateOps.$addToSet = $addToSet;
    }
    if (Object.keys($pull).length) {
        updateOps.$pull = $pull;
    }
    if (Object.keys(updateOps).length) {
        updateOps.$set = data;
        data = updateOps;
    }
    const options = {
        ...optionsArgs,
        lean: true,
        new: true,
        projection: buildProjectionFromSelect({
            adapter: this,
            fields: collectionConfig.flattenedFields,
            select
        }),
        session: await getSession(this, req),
        // Timestamps are manually added by the write transform
        timestamps: false
    };
    try {
        if (typeof limit === 'number' && limit > 0) {
            const documentsToUpdate = await Model.find(query, {}, {
                ...options,
                limit,
                projection: {
                    _id: 1
                },
                sort
            });
            if (documentsToUpdate.length === 0) {
                return null;
            }
            query = {
                _id: {
                    $in: documentsToUpdate.map((doc)=>doc._id)
                }
            };
        }
        await Model.updateMany(query, data, options);
    } catch (error) {
        handleError({
            collection: collectionSlug,
            error,
            req
        });
    }
    if (returning === false) {
        return null;
    }
    const result = await Model.find(query, {}, {
        ...options,
        sort
    });
    transform({
        adapter: this,
        data: result,
        fields: collectionConfig.fields,
        operation: 'read'
    });
    return result;
};

//# sourceMappingURL=updateMany.js.map