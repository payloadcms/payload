"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populate = void 0;
const populate = async ({ id, collection, data, key, overrideAccess, depth, currentDepth, req, showHiddenFields, }) => {
    const dataRef = data;
    const doc = await req.payloadDataLoader.load(JSON.stringify([
        collection.config.slug,
        id,
        depth,
        currentDepth + 1,
        req.locale,
        req.fallbackLocale,
        typeof overrideAccess === 'undefined' ? false : overrideAccess,
        showHiddenFields,
    ]));
    if (doc) {
        dataRef[key] = doc;
    }
    else {
        dataRef[key] = null;
    }
};
exports.populate = populate;
//# sourceMappingURL=populate.js.map