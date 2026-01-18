export const isObjectID = (value)=>{
    if (value && typeof value === 'object' && '_bsontype' in value && value._bsontype === 'ObjectId' && 'toHexString' in value && typeof value.toHexString === 'function') {
        return true;
    }
    return false;
};

//# sourceMappingURL=isObjectID.js.map