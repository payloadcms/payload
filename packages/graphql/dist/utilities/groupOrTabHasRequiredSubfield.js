import { fieldAffectsData } from 'payload/shared';
export const groupOrTabHasRequiredSubfield = (entity)=>{
    if ('type' in entity && entity.type === 'group') {
        return entity.fields.some((subField)=>{
            return fieldAffectsData(subField) && 'required' in subField && subField.required || groupOrTabHasRequiredSubfield(subField);
        });
    }
    if ('fields' in entity && 'name' in entity) {
        return entity.fields.some((subField)=>groupOrTabHasRequiredSubfield(subField));
    }
    return false;
};

//# sourceMappingURL=groupOrTabHasRequiredSubfield.js.map