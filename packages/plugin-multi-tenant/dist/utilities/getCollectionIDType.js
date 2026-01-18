export const getCollectionIDType = ({ collectionSlug, payload })=>{
    return payload.collections[collectionSlug]?.customIDType ?? payload.db.defaultIDType;
};

//# sourceMappingURL=getCollectionIDType.js.map