const typeMap = {
    number: 'number',
    serial: 'number',
    text: 'text',
    uuid: 'text'
};
export const getCollectionIdType = ({ adapter, collection })=>{
    return collection.customIDType ?? typeMap[adapter.idType];
};

//# sourceMappingURL=getCollectionIdType.js.map