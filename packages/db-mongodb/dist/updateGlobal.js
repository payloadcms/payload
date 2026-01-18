import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js';
import { getGlobal } from './utilities/getEntity.js';
import { getSession } from './utilities/getSession.js';
import { transform } from './utilities/transform.js';
export const updateGlobal = async function updateGlobal({ slug: globalSlug, data, options: optionsArgs = {}, req, returning, select }) {
    const { globalConfig, Model } = getGlobal({
        adapter: this,
        globalSlug
    });
    const fields = globalConfig.fields;
    transform({
        adapter: this,
        data,
        fields,
        globalSlug,
        operation: 'write'
    });
    const options = {
        ...optionsArgs,
        lean: true,
        new: true,
        projection: buildProjectionFromSelect({
            adapter: this,
            fields: globalConfig.flattenedFields,
            select
        }),
        session: await getSession(this, req),
        // Timestamps are manually added by the write transform
        timestamps: false
    };
    if (returning === false) {
        await Model.updateOne({
            globalType: globalSlug
        }, data, options);
        return null;
    }
    const result = await Model.findOneAndUpdate({
        globalType: globalSlug
    }, data, options);
    transform({
        adapter: this,
        data: result,
        fields,
        globalSlug,
        operation: 'read'
    });
    return result;
};

//# sourceMappingURL=updateGlobal.js.map