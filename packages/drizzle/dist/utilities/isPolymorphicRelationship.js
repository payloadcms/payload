export const isPolymorphicRelationship = (value)=>{
    return value && typeof value === 'object' && 'relationTo' in value && typeof value.relationTo === 'string' && 'value' in value;
};

//# sourceMappingURL=isPolymorphicRelationship.js.map