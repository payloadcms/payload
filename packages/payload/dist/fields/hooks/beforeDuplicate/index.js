import { traverseFields } from './traverseFields.js';
/**
 * This function is responsible for running beforeDuplicate hooks
 * against a document including all locale data.
 * It will run each field's beforeDuplicate hook
 * and return the resulting docWithLocales.
 */ export const beforeDuplicate = async ({ id, collection, context, doc, overrideAccess, req })=>{
    await traverseFields({
        id,
        collection,
        context,
        doc,
        fields: collection.fields,
        overrideAccess,
        parentIndexPath: '',
        parentIsLocalized: false,
        parentPath: '',
        parentSchemaPath: '',
        req,
        siblingDoc: doc
    });
    return doc;
};

//# sourceMappingURL=index.js.map