import { promise } from './promise.js';
export const traverseFields = async ({ id, blockData, collection, context, doc, fields, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingDoc })=>{
    const promises = [];
    fields.forEach((field, fieldIndex)=>{
        promises.push(promise({
            id,
            blockData,
            collection,
            context,
            doc,
            field,
            fieldIndex,
            overrideAccess,
            parentIndexPath,
            parentIsLocalized,
            parentPath,
            parentSchemaPath,
            req,
            siblingDoc,
            siblingFields: fields
        }));
    });
    await Promise.all(promises);
};

//# sourceMappingURL=traverseFields.js.map