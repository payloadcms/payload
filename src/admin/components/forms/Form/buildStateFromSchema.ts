import ObjectID from 'bson-objectid';
import { User } from '../../../../auth';
import {
  Field as FieldSchema,
  fieldAffectsData,
  FieldAffectingData,
  fieldIsPresentationalOnly,
  ValidateOptions,
} from '../../../../fields/config/types';
import getValueWithDefault from '../../../../fields/getDefaultValue';
import { Fields, Field, Data } from './types';

type BuildValuePromiseArgs = {
  value: unknown
  defaultValue: unknown
  locale: string
  user: User
}

const buildValuePromise = async (fieldState: Omit<Field, 'value' | 'initialValue'>, args: BuildValuePromiseArgs) => {
  const fieldStateWithValues: Partial<Field> = fieldState;
  const { value, defaultValue, locale, user } = args;

  const valueWithDefault = await getValueWithDefault({ value, defaultValue, locale, user });

  fieldStateWithValues.value = valueWithDefault;
  fieldStateWithValues.initialValue = valueWithDefault;
};

type BuildValidationPromiseArgs = FieldAffectingData & ValidateOptions<unknown, unknown, unknown>;

const buildValidationPromise = async (fieldState: Partial<Field>, args: BuildValidationPromiseArgs) => {
  const validatedFieldState = fieldState;

  let validationResult: boolean | string = true;

  if (typeof fieldState.validate === 'function') {
    validationResult = await fieldState.validate(fieldState.value, args);
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
  locale: string
}

const buildStateFromSchema = async (args: Args): Promise<Fields> => {
  const {
    fieldSchema,
    data: fullData = {},
    user,
    id,
    operation,
    locale,
  } = args;

  if (fieldSchema) {
    const validationPromises = [];
    const valuePromises = [];

    const structureFieldState = (field: FieldAffectingData, passesCondition: boolean, data = {}) => {
      const fieldState = {
        valid: true,
        validate: field.validate,
        condition: field.admin?.condition,
        passesCondition,
      };

      valuePromises.push(() => buildValuePromise(fieldState, {
        value: data?.[field.name],
        defaultValue: field.defaultValue,
        locale,
        user,
      }));

      validationPromises.push(() => buildValidationPromise(fieldState, {
        ...field,
        data: fullData,
        user,
        siblingData: data,
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
            [`${path}${field.name}`]: structureFieldState(field, passesCondition, data),
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
          [`${path}${namedField.name}`]: structureFieldState(field, passesCondition, data),
        };
      }

      return state;
    }, {});

    const resultingState = iterateFields(fieldSchema, fullData, true);
    await Promise.all(validationPromises);

    // Calculate default values first
    const valueResults = valuePromises.map((promise) => promise());
    await Promise.all(valueResults);

    // Then validate once values have been calculated
    const validationResults = validationPromises.map((promise) => promise());
    await Promise.all(validationResults);

    return resultingState;
  }

  return {};
};


export default buildStateFromSchema;
