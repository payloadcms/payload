import ObjectID from 'bson-objectid';
import { User } from '../../../../auth';
import {
  Field as FieldSchema,
  fieldAffectsData,
  FieldAffectingData,
  fieldIsPresentationalOnly,
  ValidateOptions,
} from '../../../../fields/config/types';
import { Fields, Field, Data } from './types';

const buildValidationPromise = async (fieldState: Field, options: ValidateOptions<unknown, unknown, FieldSchema>) => {
  const validatedFieldState = fieldState;

  let validationResult: boolean | string = true;

  if (fieldAffectsData(options.field) && typeof options.field.validate === 'function') {
    validationResult = await options.field.validate(fieldState.value, options);
  }

  if (typeof validationResult === 'string') {
    validatedFieldState.errorMessage = validationResult;
    validatedFieldState.valid = false;
  } else {
    validatedFieldState.valid = true;
  }
};

type Args = {
  fieldSchema: FieldSchema[]
  data?: Data,
  siblingData?: Data,
  user?: User,
  id?: string | number,
  operation?: 'create' | 'update'
}

const buildStateFromSchema = async (args: Args): Promise<Fields> => {
  const {
    fieldSchema,
    data: fullData = {},
    user,
    id,
    operation,
  } = args;

  if (fieldSchema) {
    const validationPromises = [];

    const structureFieldState = (field, passesCondition, data = {}, siblingData = {}) => {
      const value = typeof data?.[field.name] !== 'undefined' ? data[field.name] : field.defaultValue;

      const fieldState = {
        field,
        value,
        initialValue: value,
        valid: true,
        validate: field.validate,
        condition: field.admin?.condition,
        passesCondition,
      };

      validationPromises.push(buildValidationPromise(fieldState, {
        field,
        data: fullData,
        user,
        siblingData,
        id,
        operation,
      }));

      return fieldState;
    };

    const iterateFields = (fields: FieldSchema[], data: Data, parentPassesCondition: boolean, path = '') => fields.reduce((state, field) => {
      let initialData = data;

      if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
        if (fieldAffectsData(field) && field.defaultValue && typeof initialData?.[field.name] === 'undefined') {
          initialData = { [field.name]: field.defaultValue };
        }

        const passesCondition = Boolean((field?.admin?.condition ? field.admin.condition(fullData || {}, initialData || {}) : true) && parentPassesCondition);

        if (fieldAffectsData(field)) {
          if (field.type === 'relationship' && initialData?.[field.name] === null) {
            initialData[field.name] = 'null';
          }

          if (field.type === 'array' || field.type === 'blocks') {
            if (Array.isArray(initialData?.[field.name])) {
              const rows = initialData[field.name] as Data[];

              if (field.type === 'array') {
                return {
                  ...state,
                  ...rows.reduce((rowState, row, i) => {
                    const rowPath = `${path}${field.name}.${i}.`;

                    return {
                      ...rowState,
                      [`${rowPath}id`]: {
                        value: row.id,
                        initialValue: row.id || new ObjectID().toHexString(),
                        valid: true,
                      },
                      ...iterateFields(field.fields, row, passesCondition, rowPath),
                    };
                  }, {}),
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
                      [`${rowPath}id`]: {
                        value: row.id,
                        initialValue: row.id || new ObjectID().toHexString(),
                        valid: true,
                      },
                      ...(block?.fields ? iterateFields(block.fields, row, passesCondition, rowPath) : {}),
                    };
                  }, {}),
                };
              }
            }

            return state;
          }

          // Handle non-array-based nested fields (group, etc)
          if (field.type === 'group') {
            const subFieldData = initialData?.[field.name] as Data;

            return {
              ...state,
              ...iterateFields(field.fields, subFieldData, passesCondition, `${path}${field.name}.`),
            };
          }

          return {
            ...state,
            [`${path}${field.name}`]: structureFieldState(field, passesCondition, fullData, data),
          };
        }

        // Handle field types that do not use names (row, etc)
        if (field.type === 'row') {
          return {
            ...state,
            ...iterateFields(field.fields, data, passesCondition, path),
          };
        }

        const namedField = field as FieldAffectingData;

        // Handle normal fields
        return {
          ...state,
          [`${path}${namedField.name}`]: structureFieldState(field, passesCondition, fullData, data),
        };
      }

      return state;
    }, {});

    const resultingState = iterateFields(fieldSchema, fullData, true);
    await Promise.all(validationPromises);
    return resultingState;
  }

  return {};
};


export default buildStateFromSchema;
