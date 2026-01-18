import { promise } from './promise.js';
export const traverseFields = async ({ id, blockData, collection, context, data, doc, fields, global, operation, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingData, siblingDoc })=>{
    const promises = [];
    fields.forEach((field, fieldIndex)=>{
        promises.push(promise({
            id,
            blockData,
            collection,
            context,
            data,
            doc,
            field,
            fieldIndex,
            global,
            operation,
            overrideAccess,
            parentIndexPath,
            parentIsLocalized: parentIsLocalized,
            parentPath,
            parentSchemaPath,
            req,
            siblingData,
            siblingDoc,
            siblingFields: fields
        }));
    });
    await Promise.all(promises);
};

//# sourceMappingURL=traverseFields.js.map