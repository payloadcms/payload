import { fieldAffectsData, fieldIsID } from 'payload/shared';
export const formatFields = (fields, isEditing) => isEditing ? fields.filter(field => !fieldAffectsData(field) || !fieldIsID(field)) : fields;
//# sourceMappingURL=formatFields.js.map