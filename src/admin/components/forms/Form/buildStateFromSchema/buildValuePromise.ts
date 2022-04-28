/* eslint-disable no-param-reassign */
import ObjectID from 'bson-objectid';
import { User } from '../../../../../auth';
import { FieldAffectingData } from '../../../../../fields/config/types';
import getValueWithDefault from '../../../../../fields/getDefaultValue';
import { Fields, Field, Data } from '../types';
import { iterateFields } from './iterateFields';

type Args = {
  fieldState: Omit<Field, 'value' | 'initialValue'>
  field: FieldAffectingData
  locale: string
  user: User
  state: Fields
  path: string
  passesCondition: boolean
  validationPromises: (() => Promise<void>)[]
  valuePromises: (() => Promise<void>)[]
  id: string | number
  operation: 'create' | 'update'
  data: Data
  fullData: Data
}

export const buildValuePromise = async ({
  fieldState,
  field,
  locale,
  user,
  state,
  path,
  passesCondition,
  fullData,
  data,
  valuePromises,
  validationPromises,
  id,
  operation,
}: Args): Promise<void> => {
  const fieldStateWithValues: Partial<Field> = fieldState;

  if (field.name === 'child') {
    console.log(data);
  }

  const valueWithDefault = await getValueWithDefault({ value: data[field.name], defaultValue: field.defaultValue, locale, user });
  data[field.name] = valueWithDefault;

  if (Array.isArray(valueWithDefault)) {
    if (field.type === 'array') {
      valueWithDefault.forEach((row, i) => {
        const rowPath = `${path}${field.name}.${i}.`;
        state.id = {
          value: row.id,
          initialValue: row.id || new ObjectID().toHexString(),
          valid: true,
        };

        const rowFields = iterateFields({
          fields: field.fields,
          data: row,
          parentPassesCondition: passesCondition,
          path: rowPath,
          user,
          validationPromises,
          valuePromises,
          fullData,
          id,
          locale,
          operation,
        });

        Object.entries(rowFields).forEach(([subFieldPath, subField]) => {
          state[subFieldPath] = subField;
        });
      });
    }

    // if (field.type === 'blocks') {
    //   return {
    //     ...state,
    //     ...rows.reduce((rowState, row, i) => {
    //       const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
    //       const rowPath = `${path}${field.name}.${i}.`;
    //       return {
    //         ...rowState,
    //         [`${rowPath}blockType`]: {
    //           value: row.blockType,
    //           initialValue: row.blockType,
    //           valid: true,
    //         },
    //         [`${rowPath}blockName`]: {
    //           value: row.blockName,
    //           initialValue: row.blockName,
    //           valid: true,
    //         },
    //         [`${rowPath}id`]: {
    //           value: row.id,
    //           initialValue: row.id || new ObjectID().toHexString(),
    //           valid: true,
    //         },
    //         ...(block?.fields ? iterateFields(block.fields,
    //           row,
    //           passesCondition,
    //           rowPath) : {}),
    //       };
    //     }, {}),
    //   };
    // }
  }

  fieldStateWithValues.value = valueWithDefault;
  fieldStateWithValues.initialValue = valueWithDefault;
};
