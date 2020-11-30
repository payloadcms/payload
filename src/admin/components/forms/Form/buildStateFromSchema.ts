import { Field as FieldSchema } from '../../../../fields/config/types';
import { Fields, Field, Data } from './types';

const buildValidationPromise = async (fieldState: Field, field: FieldSchema) => {
  const validatedFieldState = fieldState;

  validatedFieldState.valid = typeof field.validate === 'function' ? await field.validate(fieldState.value, field) : true;

  if (typeof validatedFieldState.valid === 'string') {
    validatedFieldState.errorMessage = validatedFieldState.valid;
    validatedFieldState.valid = false;
  }
};

const buildStateFromSchema = async (fieldSchema: FieldSchema[], fullData: Data = {}): Promise<Fields> => {
  if (fieldSchema) {
    const validationPromises = [];

    const structureFieldState = (field, data = {}) => {
      const value = typeof data?.[field.name] !== 'undefined' ? data[field.name] : field.defaultValue;

      const fieldState = {
        value,
        initialValue: value,
        valid: true,
      };

      validationPromises.push(buildValidationPromise(fieldState, field));

      return fieldState;
    };

    const iterateFields = (fields: FieldSchema[], data: Data, path = '') => fields.reduce((state, field) => {
      let initialData = data;

      if (field.name && field.defaultValue && typeof initialData?.[field.name] === 'undefined') {
        initialData = { [field.name]: field.defaultValue };
      }

      if (field.name) {
        if (field.type === 'relationship' && initialData?.[field.name] === null) {
          initialData[field.name] = 'null';
        }

        if (field.type === 'array' || field.type === 'blocks') {
          if (Array.isArray(initialData?.[field.name])) {
            const rows = initialData[field.name] as Data[];

            if (field.type === 'array') {
              return {
                ...state,
                ...rows.reduce((rowState, row, i) => ({
                  ...rowState,
                  ...iterateFields(field.fields, row, `${path}${field.name}.${i}.`),
                }), {}),
              };
            }

            if (field.type === 'blocks') {
              return {
                ...state,
                ...rows.reduce((rowState, row, i) => {
                  const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
                  const rowPath = `${path}${field.name}.${i}.`;

                  return {
                    ...rowState,
                    [`${rowPath}blockType`]: {
                      value: row.blockType,
                      initialValue: row.blockType,
                      valid: true,
                    },
                    [`${rowPath}blockName`]: {
                      value: row.blockName,
                      initialValue: row.blockName,
                      valid: true,
                    },
                    ...(block?.fields ? iterateFields(block.fields, row, rowPath) : {}),
                  };
                }, {}),
              };
            }
          }

          return state;
        }

        // Handle non-array-based nested fields (group, etc)
        if (field.type === 'row' || field.type === 'group') {
          const subFieldData = initialData?.[field.name] as Data;

          return {
            ...state,
            ...iterateFields(field.fields, subFieldData, `${path}${field.name}.`),
          };
        }

        return {
          ...state,
          [`${path}${field.name}`]: structureFieldState(field, data),
        };
      }

      // Handle field types that do not use names (row, etc)
      if (field.type === 'row' || field.type === 'group') {
        return {
          ...state,
          ...iterateFields(field.fields, data, path),
        };
      }

      // Handle normal fields
      return {
        ...state,
        [`${path}${field.name}`]: structureFieldState(field, data),
      };
    }, {});

    const resultingState = iterateFields(fieldSchema, fullData);
    await Promise.all(validationPromises);
    return resultingState;
  }

  return {};
};


export default buildStateFromSchema;
