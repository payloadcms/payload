declare const sanitizeInternalFields: <T extends Record<string, unknown>>(incomingDoc: T) => T;
export default sanitizeInternalFields;
