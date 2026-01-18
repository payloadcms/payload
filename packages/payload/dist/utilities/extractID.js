export const extractID = (objectOrID)=>{
    if (typeof objectOrID === 'string' || typeof objectOrID === 'number') {
        return objectOrID;
    }
    return objectOrID.id;
};

//# sourceMappingURL=extractID.js.map