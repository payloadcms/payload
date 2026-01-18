export const sanitizeInternalFields = (incomingDoc)=>{
    // Create a new object to hold the sanitized fields
    const newDoc = {};
    for(const key in incomingDoc){
        const val = incomingDoc[key];
        if (key === '_id') {
            newDoc['id'] = val;
        } else if (key !== '__v') {
            newDoc[key] = val;
        }
    }
    return newDoc;
};

//# sourceMappingURL=sanitizeInternalFields.js.map