export const idToUUID = (fields)=>fields.map((field)=>{
        if ('name' in field && field.name === 'id') {
            return {
                ...field,
                name: '_uuid'
            };
        }
        return field;
    });

//# sourceMappingURL=idToUUID.js.map