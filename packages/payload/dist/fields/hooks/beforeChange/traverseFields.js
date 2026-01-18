import { promise } from './promise.js';
/**
 * This function is responsible for the following actions, in order:
 * - Run condition
 * - Execute field hooks
 * - Validate data
 * - Transform data for storage
 * - Unflatten locales. The input `data` is the normal document for one locale. The output result will become the document with locales.
 */ export const traverseFields = async ({ id, blockData, collection, context, data, doc, docWithLocales, errors, fieldLabelPath, fields, global, mergeLocaleActions, operation, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingData, siblingDoc, siblingDocWithLocales, skipValidation })=>{
    const promises = [];
    fields.forEach((field, fieldIndex)=>{
        promises.push(promise({
            id,
            blockData,
            collection,
            context,
            data,
            doc,
            docWithLocales,
            errors,
            field,
            fieldIndex,
            fieldLabelPath,
            global,
            mergeLocaleActions,
            operation,
            overrideAccess,
            parentIndexPath,
            parentIsLocalized: parentIsLocalized,
            parentPath,
            parentSchemaPath,
            req,
            siblingData,
            siblingDoc,
            siblingDocWithLocales,
            siblingFields: fields,
            skipValidation: skipValidation
        }));
    });
    await Promise.all(promises);
};

//# sourceMappingURL=traverseFields.js.map