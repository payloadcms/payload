import { ValidationError } from '../../../errors/index.js';
import { deepCopyObjectSimple } from '../../../utilities/deepCopyObject.js';
import { traverseFields } from './traverseFields.js';
/**
 * This function is responsible for the following actions, in order:
 * - Run condition
 * - Execute field hooks
 * - Validate data
 * - Transform data for storage
 * - Unflatten locales. The input `data` is the normal document for one locale. The output result will become the document with locales.
 */ export const beforeChange = async ({ id, collection, context, data: incomingData, doc, docWithLocales, global, operation, overrideAccess, req, skipValidation })=>{
    const data = deepCopyObjectSimple(incomingData);
    const mergeLocaleActions = [];
    const errors = [];
    await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fieldLabelPath: '',
        fields: collection?.fields || global?.fields,
        global,
        mergeLocaleActions,
        operation,
        overrideAccess: overrideAccess,
        parentIndexPath: '',
        parentIsLocalized: false,
        parentPath: '',
        parentSchemaPath: '',
        req,
        siblingData: data,
        siblingDoc: doc,
        siblingDocWithLocales: docWithLocales,
        skipValidation
    });
    if (errors.length > 0) {
        throw new ValidationError({
            id,
            collection: collection?.slug,
            errors,
            global: global?.slug,
            req
        }, req.t);
    }
    for (const action of mergeLocaleActions){
        await action();
    }
    return data;
};

//# sourceMappingURL=index.js.map