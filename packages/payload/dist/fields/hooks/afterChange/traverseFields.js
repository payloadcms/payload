import { promise } from './promise.js';
export const traverseFields = async ({ blockData, collection, context, data, doc, fields, global, operation, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, previousDoc, previousSiblingDoc, req, siblingData, siblingDoc, siblingFields })=>{
    const promises = [];
    fields.forEach((field, fieldIndex)=>{
        promises.push(promise({
            blockData,
            collection,
            context,
            data,
            doc,
            field,
            fieldIndex,
            global,
            operation,
            parentIndexPath,
            parentIsLocalized: parentIsLocalized,
            parentPath,
            parentSchemaPath,
            previousDoc,
            previousSiblingDoc,
            req,
            siblingData,
            siblingDoc,
            siblingFields
        }));
    });
    await Promise.all(promises);
};

//# sourceMappingURL=traverseFields.js.map