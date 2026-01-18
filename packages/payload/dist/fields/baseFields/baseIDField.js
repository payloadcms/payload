import ObjectIdImport from 'bson-objectid';
const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport;
export const baseIDField = {
    name: 'id',
    type: 'text',
    admin: {
        hidden: true
    },
    defaultValue: ()=>new ObjectId().toHexString(),
    hooks: {
        beforeChange: [
            ({ value })=>value || new ObjectId().toHexString()
        ],
        // ID field values for arrays and blocks need to be unique when duplicating, as on postgres they are stored on the same table as primary keys.
        beforeDuplicate: [
            ()=>new ObjectId().toHexString()
        ]
    },
    label: 'ID'
};

//# sourceMappingURL=baseIDField.js.map