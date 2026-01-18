// @ts-strict-ignore
// default beforeDuplicate hook for required and unique fields
import { fieldShouldBeLocalized } from './config/types.js';
const isStringValue = (value)=>typeof value === 'string' && value.trim() !== '';
const unique = ({ value })=>isStringValue(value) ? `${value} - Copy` : undefined;
const localizedUnique = ({ req, value })=>isStringValue(value) ? `${value} - ${req?.t('general:copy') ?? 'Copy'}` : undefined;
export const setDefaultBeforeDuplicate = (field, parentIsLocalized)=>{
    if (('required' in field && field.required || field.unique) && 'hooks' in field && (!field.hooks?.beforeDuplicate || Array.isArray(field.hooks.beforeDuplicate) && field.hooks.beforeDuplicate.length === 0)) {
        if (field.unique) {
            if ([
                'email',
                'number',
                'point',
                'relationship',
                'select',
                'upload'
            ].includes(field.type)) {
                field.hooks.beforeDuplicate = [
                    ()=>undefined
                ];
            } else if ([
                'code',
                'json',
                'text',
                'textarea'
            ].includes(field.type)) {
                field.hooks.beforeDuplicate = fieldShouldBeLocalized({
                    field,
                    parentIsLocalized
                }) ? [
                    localizedUnique
                ] : [
                    unique
                ];
            }
        }
    }
};

//# sourceMappingURL=setDefaultBeforeDuplicate.js.map