import { buildQuery } from './queries/buildQuery.js';
import { aggregatePaginate } from './utilities/aggregatePaginate.js';
import { buildJoinAggregation } from './utilities/buildJoinAggregation.js';
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js';
import { getCollection } from './utilities/getEntity.js';
import { getSession } from './utilities/getSession.js';
import { resolveJoins } from './utilities/resolveJoins.js';
import { transform } from './utilities/transform.js';
export const findOne = async function findOne({ collection: collectionSlug, draftsEnabled, joins, locale, req, select, where = {} }) {
    const { collectionConfig, Model } = getCollection({
        adapter: this,
        collectionSlug
    });
    const query = await buildQuery({
        adapter: this,
        collectionSlug,
        fields: collectionConfig.flattenedFields,
        locale,
        where
    });
    const projection = buildProjectionFromSelect({
        adapter: this,
        fields: collectionConfig.flattenedFields,
        select
    });
    const aggregate = await buildJoinAggregation({
        adapter: this,
        collection: collectionSlug,
        collectionConfig,
        draftsEnabled,
        joins,
        locale,
        projection,
        query
    });
    const session = await getSession(this, req);
    const options = {
        lean: true,
        session
    };
    let doc;
    if (aggregate) {
        const { docs } = await aggregatePaginate({
            adapter: this,
            joinAggregation: aggregate,
            limit: 1,
            Model,
            pagination: false,
            projection,
            query,
            session
        });
        doc = docs[0];
    } else {
        ;
        options.projection = projection;
        doc = await Model.findOne(query, {}, options);
    }
    if (doc && !this.useJoinAggregations) {
        await resolveJoins({
            adapter: this,
            collectionSlug,
            docs: [
                doc
            ],
            joins,
            locale
        });
    }
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

//# sourceMappingURL=findOne.js.map