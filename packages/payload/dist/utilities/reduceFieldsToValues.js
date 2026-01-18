import { unflatten as flatleyUnflatten } from './unflatten.js';
/**
 * Reduce flattened form fields (Fields) to just map to the respective values instead of the full FormField object
 *
 * @param unflatten This also unflattens the data if `unflatten` is true. The unflattened data should match the original data structure
 * @param ignoreDisableFormData - if true, will include fields that have `disableFormData` set to true, for example, blocks or arrays fields.
 *
 */ export const reduceFieldsToValues = (fields, unflatten, ignoreDisableFormData)=>{
    let data = {};
    if (!fields) {
        return data;
    }
    Object.keys(fields).forEach((key)=>{
        if (ignoreDisableFormData === true || !fields[key]?.disableFormData) {
            data[key] = fields[key]?.value;
        }
    });
    if (unflatten) {
        data = flatleyUnflatten(data);
    }
    return data;
};

//# sourceMappingURL=reduceFieldsToValues.js.map