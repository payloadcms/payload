import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js';
export const initOperation = async (args)=>{
    const { collection: slug, req } = args;
    const collectionConfig = req.payload.config.collections?.find((c)=>c.slug === slug);
    // Exclude trashed documents unless `trash: true`
    const where = appendNonTrashedFilter({
        enableTrash: Boolean(collectionConfig?.trash),
        trash: false,
        where: {}
    });
    const doc = await req.payload.db.findOne({
        collection: slug,
        req,
        where
    });
    return !!doc;
};

//# sourceMappingURL=init.js.map