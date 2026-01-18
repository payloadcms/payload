import { unflatten as flatleyUnflatten } from 'payload/shared';
/**
 * Reduce flattened form fields (Fields) to just map to the respective values instead of the full FormField object
 *
 * @param unflatten This also unflattens the data if `unflatten` is true. The unflattened data should match the original data structure
 * @param ignoreDisableFormData - if true, will include fields that have `disableFormData` set to true, for example, blocks or arrays fields.
 *
 */
export const reduceFieldsToValuesWithValidation = (fields, unflatten, ignoreDisableFormData) => {
  const state = {
    data: {},
    valid: true
  };
  if (!fields) {
    return state;
  }
  Object.keys(fields).forEach(key => {
    if (ignoreDisableFormData === true || !fields[key]?.disableFormData) {
      state.data[key] = fields[key]?.value;
      if (!fields[key].valid) {
        state.valid = false;
      }
    }
  });
  if (unflatten) {
    state.data = flatleyUnflatten(state.data);
  }
  return state;
};
//# sourceMappingURL=reduceFieldsToValuesWithValidation.js.map