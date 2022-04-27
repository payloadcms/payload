import ObjectID from 'bson-objectid';
import { User } from '../../../../auth';
import getDefaultValue from './getDefaultValue';
import {
  Field as FieldSchema,
  fieldAffectsData,
  FieldAffectingData,
  fieldIsPresentationalOnly,
  ValidateOptions,
} from '../../../../fields/config/types';
import { Fields, Field, Data } from './types';

const buildValidationPromise = async (fieldState: Field, options: ValidateOptions<unknown, unknown, unknown>) => {
  const validatedFieldState = fieldState;

  let validationResult: boolean | string = true;

  if (typeof fieldState.validate === 'function') {
    validationResult = await fieldState.validate(fieldState.value, options);
  }

  if (typeof validationResult === 'string') {
    validatedFieldState.errorMessage = validationResult;
    validatedFieldState.valid = false;
  } else {
    validatedFieldState.valid = true;
  }
};

type Args = {
  locale: string | undefined,
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
    locale,
  } = args;

  if (fieldSchema) {
    const validationPromises = [];
    const defaultValuePromises = [];

    const structureFieldState = async (field, passesCondition, data = {}) => {
      const value = await getDefaultValue({ value: data?.[field.name], defaultValue: field.defaultValue, locale, user });

      const fieldState = {
        value,
        initialValue: value,
        valid: true,
        validate: field.validate,
        condition: field.admin?.condition,
        passesCondition,
      };


      validationPromises.push(buildValidationPromise(fieldState, {
        ...field,
        fullData,
        user,
        siblingData: data,
        id,
        operation,
      }));

      return fieldState;
    };

    const iterateFields = async (fields: FieldSchema[], data: Data, parentPassesCondition: boolean, path = '') => fields.reduce(async (state: Promise<Record<string, unknown>>, field) => {
      const initialData = data;

      if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
        if (fieldAffectsData(field) && field.defaultValue && typeof initialData?.[field.name] === 'undefined') {
          const defaultValue = await getDefaultValue({ defaultValue: field.defaultValue, locale, user });
          initialData[field.name] = defaultValue;
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
                  ...(await state),
                  ...rows.reduce(async (rowState, row, i) => {
                    const rowPath = `${path}${field.name}.${i}.`;

                    return {
                      ...(await rowState),
                      [`${rowPath}id`]: {
                        value: row.id,
                        initialValue: row.id || new ObjectID().toHexString(),
                        valid: true,
                      },
                      ...(await iterateFields(field.fields, row, passesCondition, rowPath)),
                    };
                  }, {}),
                };
              }

              if (field.type === 'blocks') {
                return {
                  ...(await state),
                  ...rows.reduce(async (rowState, row, i) => {
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
                      ...(block?.fields ? (await iterateFields(block.fields, row, passesCondition, rowPath)) : {}),
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
              ...(await state),
              ...(await iterateFields(field.fields, subFieldData, passesCondition, `${path}${field.name}.`)),
            };
          }

          return {
            ...(await state),
            [`${path}${field.name}`]: await structureFieldState(field, passesCondition, data),
          };
        }

        // Handle field types that do not use names (row, etc)
        if (field.type === 'row') {
          return {
            ...(await state),
            ...(await iterateFields(field.fields, data, passesCondition, path)),
          };
        }

        const namedField = field as FieldAffectingData;

        // Handle normal fields
        return {
          ...(await state),
          [`${path}${namedField.name}`]: await structureFieldState(field, passesCondition, data),
        };
      }

      return state;
    }, {} as Promise<Record<string, unknown>>);

    const resultingState = await iterateFields(fieldSchema, fullData, true);
    await Promise.all(validationPromises);
    return resultingState;
  }

  return {};
};


export default buildStateFromSchema;
