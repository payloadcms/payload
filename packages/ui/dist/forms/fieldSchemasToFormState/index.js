import { calculateDefaultValues } from './calculateDefaultValues/index.js';
import { iterateFields } from './iterateFields.js';
export const fieldSchemasToFormState = async ({
  id,
  clientFieldSchemaMap,
  collectionSlug,
  data = {},
  documentData,
  fields,
  fieldSchemaMap,
  initialBlockData,
  mockRSCs,
  operation,
  permissions,
  preferences,
  previousFormState,
  readOnly,
  renderAllFields,
  renderFieldFn,
  req,
  schemaPath,
  select,
  selectMode,
  skipValidation
}) => {
  if (!clientFieldSchemaMap && renderFieldFn) {
    // eslint-disable-next-line no-console
    console.warn('clientFieldSchemaMap is not passed to fieldSchemasToFormState - this will reduce performance');
  }
  if (fields && fields.length) {
    const state = {};
    const dataWithDefaultValues = {
      ...data
    };
    await calculateDefaultValues({
      id,
      data: dataWithDefaultValues,
      fields,
      locale: req.locale,
      req,
      select,
      selectMode,
      siblingData: dataWithDefaultValues,
      user: req.user
    });
    let fullData = dataWithDefaultValues;
    if (documentData) {
      // By the time this function is used to get form state for nested forms, their default values should have already been calculated
      // => no need to run calculateDefaultValues here
      fullData = documentData;
    }
    await iterateFields({
      id,
      addErrorPathToParent: null,
      blockData: initialBlockData,
      clientFieldSchemaMap,
      collectionSlug,
      data: dataWithDefaultValues,
      fields,
      fieldSchemaMap,
      fullData,
      mockRSCs,
      operation,
      parentIndexPath: '',
      parentPassesCondition: true,
      parentPath: '',
      parentSchemaPath: schemaPath,
      permissions,
      preferences,
      previousFormState,
      readOnly,
      renderAllFields,
      renderFieldFn,
      req,
      select,
      selectMode,
      skipValidation,
      state
    });
    return state;
  }
  return {};
};
export { iterateFields };
//# sourceMappingURL=index.js.map