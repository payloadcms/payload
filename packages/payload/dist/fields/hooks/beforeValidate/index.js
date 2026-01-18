import { traverseFields } from './traverseFields.js';
/**
 * This function is responsible for the following actions, in order:
 * - Sanitize incoming data
 * - Execute field hooks
 * - Execute field access control
 * - Merge original document data into incoming data
 * - Compute default values for undefined fields
 */ export const beforeValidate = async ({ id, collection, context, data: incomingData, doc, global, operation, overrideAccess, req })=>{
    await traverseFields({
        id,
        collection,
        context,
        data: incomingData,
        doc,
        fields: collection?.fields || global?.fields,
        global,
        operation,
        overrideAccess,
        parentIndexPath: '',
        parentIsLocalized: false,
        parentPath: '',
        parentSchemaPath: '',
        req,
        siblingData: incomingData,
        siblingDoc: doc
    });
    return incomingData;
};

//# sourceMappingURL=index.js.map