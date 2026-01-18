import { combineQueries } from 'payload';
import { buildQuery } from './queries/buildQuery.js';
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js';
import { getGlobal } from './utilities/getEntity.js';
import { getSession } from './utilities/getSession.js';
import { transform } from './utilities/transform.js';
export const findGlobal = async function findGlobal({ slug: globalSlug, locale, req, select, where = {} }) {
    const { globalConfig, Model } = getGlobal({
        adapter: this,
        globalSlug
    });
    const fields = globalConfig.flattenedFields;
    const query = await buildQuery({
        adapter: this,
        fields,
        globalSlug,
        locale,
        where: combineQueries({
            globalType: {
                equals: globalSlug
            }
        }, where)
    });
    const options = {
        lean: true,
        select: buildProjectionFromSelect({
            adapter: this,
            fields,
            select
        }),
        session: await getSession(this, req)
    };
    const doc = await Model.findOne(query, {}, options);
    if (!doc) {
        return null;
    }
    transform({
        adapter: this,
        data: doc,
        fields: globalConfig.fields,
        operation: 'read'
    });
    return doc;
};

//# sourceMappingURL=findGlobal.js.map