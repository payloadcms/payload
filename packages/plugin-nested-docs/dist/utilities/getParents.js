export const getParents = async (req, pluginConfig, collection, doc, docs = [])=>{
    const parentSlug = pluginConfig?.parentFieldSlug || 'parent';
    const parent = doc[parentSlug];
    let retrievedParent = null;
    if (parent) {
        // If not auto-populated, and we have an ID
        if (typeof parent === 'string' || typeof parent === 'number') {
            retrievedParent = await req.payload.findByID({
                id: parent,
                collection: collection.slug,
                depth: 0,
                disableErrors: true,
                req
            });
        }
        // If auto-populated
        if (typeof parent === 'object') {
            retrievedParent = parent;
        }
        if (retrievedParent) {
            if (retrievedParent[parentSlug]) {
                return getParents(req, pluginConfig, collection, retrievedParent, [
                    retrievedParent,
                    ...docs
                ]);
            }
            return [
                retrievedParent,
                ...docs
            ];
        }
    }
    return docs;
};

//# sourceMappingURL=getParents.js.map