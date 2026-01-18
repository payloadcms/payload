import { buildQuery } from './queries/buildQuery.js';
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js';
import { getCollection } from './utilities/getEntity.js';
import { getSession } from './utilities/getSession.js';
import { handleError } from './utilities/handleError.js';
import { transform } from './utilities/transform.js';
export const updateOne = async function updateOne({ id, collection: collectionSlug, data, locale, options: optionsArgs = {}, req, returning, select, where: whereArg = {} }) {
    const { collectionConfig, Model } = getCollection({
        adapter: this,
        collectionSlug
    });
    const where = id ? {
        id: {
            equals: id
        }
    } : whereArg;
    const fields = collectionConfig.fields;
    const query = await buildQuery({
        adapter: this,
        collectionSlug,
        fields: collectionConfig.flattenedFields,
        locale,
        where
    });
    let result;
    let updateData = data;
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
        fields,
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
        updateOps.$set = updateData;
        updateData = updateOps;
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
        if (returning === false) {
            await Model.updateOne(query, updateData, options);
            transform({
                adapter: this,
                data,
                fields,
                operation: 'read'
            });
            return null;
        } else {
            result = await Model.findOneAndUpdate(query, updateData, options);
        }
    } catch (error) {
        handleError({
            collection: collectionSlug,
            error,
            req
        });
    }
    if (!result) {
        return null;
    }
    transform({
        adapter: this,
        data: result,
        fields,
        operation: 'read'
    });
    return result;
};

//# sourceMappingURL=updateOne.js.map