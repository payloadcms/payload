import { traverseFields } from './traverseFields.js';
/**
 * This function is responsible for the following actions, in order:
 * - Execute field hooks
 */ export const afterChange = async ({ collection, context, data, doc: incomingDoc, global, operation, previousDoc, req })=>{
    await traverseFields({
        collection,
        context,
        data,
        doc: incomingDoc,
        fields: collection?.fields || global?.fields,
        global,
        operation,
        parentIndexPath: '',
        parentIsLocalized: false,
        parentPath: '',
        parentSchemaPath: '',
        previousDoc,
        previousSiblingDoc: previousDoc,
        req,
        siblingData: data,
        siblingDoc: incomingDoc
    });
    return incomingDoc;
};

//# sourceMappingURL=index.js.map