import ObjectIdImport from 'bson-objectid';
const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport;
export const isValidID = (value, type)=>{
    if (type === 'text' && value) {
        if ([
            'object',
            'string'
        ].includes(typeof value)) {
            const isObjectID = ObjectId.isValid(value);
            return typeof value === 'string' || isObjectID;
        }
        return false;
    }
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return true;
    }
    if (type === 'ObjectID') {
        return ObjectId.isValid(String(value));
    }
};

//# sourceMappingURL=isValidID.js.map