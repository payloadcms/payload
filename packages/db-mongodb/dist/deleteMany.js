import { buildQuery } from './queries/buildQuery.js';
import { getCollection } from './utilities/getEntity.js';
import { getSession } from './utilities/getSession.js';
export const deleteMany = async function deleteMany({ collection: collectionSlug, req, where }) {
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
        session: await getSession(this, req)
    };
    await Model.deleteMany(query, options);
};

//# sourceMappingURL=deleteMany.js.map