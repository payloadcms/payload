import { buildQuery } from './queries/buildQuery.js';
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js';
import { getCollection } from './utilities/getEntity.js';
import { getSession } from './utilities/getSession.js';
import { transform } from './utilities/transform.js';
export const deleteOne = async function deleteOne({ collection: collectionSlug, req, returning, select, where }) {
    const { collectionConfig, Model } = getCollection({
        adapter: this,
        collectionSlug
    });
    const query = await buildQuery({
        adapter: this,
        collectionSlug,
        fields: collectionConfig.flattenedFields,
        where
    });
    const options = {
        projection: buildProjectionFromSelect({
            adapter: this,
            fields: collectionConfig.flattenedFields,
            select
        }),
        session: await getSession(this, req)
    };
    if (returning === false) {
        await Model.deleteOne(query, options)?.lean();
        return null;
    }
    const doc = await Model.findOneAndDelete(query, options)?.lean();
    if (!doc) {
        return null;
    }
    transform({
        adapter: this,
        data: doc,
        fields: collectionConfig.fields,
        operation: 'read'
    });
    return doc;
};

//# sourceMappingURL=deleteOne.js.map