/* eslint-disable no-param-reassign */
import ObjectID from 'bson-objectid';
import type { TFunction } from 'i18next';
import { User } from '../../../../../auth';
import {
  NonPresentationalField,
  fieldAffectsData,
  fieldHasSubFields,
  tabHasName,
} from '../../../../../fields/config/types';
import getValueWithDefault from '../../../../../fields/getDefaultValue';
import { Fields, Field, Data } from '../types';
import { iterateFields } from './iterateFields';

type Args = {
  field: NonPresentationalField
  locale: string
  user: User
  state: Fields
  path: string
  passesCondition: boolean
  id: string | number
  operation: 'create' | 'update'
  data: Data
  fullData: Data
  t: TFunction
  preferences: {
    [key: string]: unknown
  }
}

export const addFieldStatePromise = async ({
  field,
  locale,
  user,
  state,
  path,
  passesCondition,
  fullData,
  data,
  id,
  operation,
  t,
  preferences,
}: Args): Promise<void> => {
  if (fieldAffectsData(field)) {
    const fieldState: Field = {
      valid: true,
      value: undefined,
      initialValue: undefined,
      validate: field.validate,
      condition: field.admin?.condition,
      passesCondition,
    };

    const valueWithDefault = await getValueWithDefault({ value: data?.[field.name], defaultValue: field.defaultValue, locale, user });
    if (data?.[field.name]) {
      data[field.name] = valueWithDefault;
    }

    let validationResult: boolean | string = true;

    if (typeof fieldState.validate === 'function') {
      validationResult = await fieldState.validate(data?.[field.name], {
        ...field,
        data: fullData,
        user,
        siblingData: data,
        id,
        operation,
        t,
      });
    }

    if (typeof validationResult === 'string') {
      fieldState.errorMessage = validationResult;
      fieldState.valid = false;
    } else {
      fieldState.valid = true;
    }

    switch (field.type) {
      case 'array': {
        const arrayValue = Array.isArray(valueWithDefault) ? valueWithDefault : [];
        const { promises, rowMetadata } = arrayValue.reduce((acc, row, i) => {
          const rowPath = `${path}${field.name}.${i}.`;
          state[`${rowPath}id`] = {
            value: row.id,
            initialValue: row.id || new ObjectID().toHexString(),
            valid: true,
          };

          acc.promises.push(iterateFields({
            state,
            fields: field.fields,
            data: row,
            parentPassesCondition: passesCondition,
            path: rowPath,
            user,
            fullData,
            id,
            locale,
            operation,
            t,
            preferences,
          }));

          console.log(`${path}${field.name}`, { preferences });
          acc.rowMetadata.push({
            id: row.id,
            collapsed: (preferences?.fields?.[`${path}${field.name}`]?.collapsed || []).includes(row.id),
          });

          return acc;
        }, {
          promises: [],
          rowMetadata: [],
        });

        console.log(rowMetadata);

        await Promise.all(promises);

        // Add values to field state
        if (valueWithDefault === null) {
          fieldState.value = null;
          fieldState.initialValue = null;
        } else {
          fieldState.value = arrayValue.length;
          fieldState.initialValue = arrayValue.length;

          if (arrayValue.length > 0) {
            fieldState.disableFormData = true;
          }
        }

        fieldState.rows = rowMetadata;

        // Add field to state
        state[`${path}${field.name}`] = fieldState;

        break;
      }

      case 'blocks': {
        const blocksValue = Array.isArray(valueWithDefault) ? valueWithDefault : [];

        const { promises, rowMetadata } = blocksValue.reduce((acc, row, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === row.blockType);
          const rowPath = `${path}${field.name}.${i}.`;

          if (block) {
            state[`${rowPath}id`] = {
              value: row.id,
              initialValue: row.id || new ObjectID().toHexString(),
              valid: true,
            };

            state[`${rowPath}blockType`] = {
              value: row.blockType,
              initialValue: row.blockType,
              valid: true,
            };

            state[`${rowPath}blockName`] = {
              value: row.blockName,
              initialValue: row.blockName,
              valid: true,
            };

            acc.promises.push(iterateFields({
              state,
              fields: block.fields,
              data: row,
              fullData,
              parentPassesCondition: passesCondition,
              path: rowPath,
              user,
              locale,
              operation,
              id,
              t,
              preferences,
            }));

            acc.rowMetadata.push({
              id: row.id,
              collapsed: (preferences?.fields?.[`${path}${field.name}`]?.collapsed || []).includes(row.id),
              blockType: row.blockType,
            });
          }

          return acc;
        }, {
          promises: [],
          rowMetadata: [],
        });

        await Promise.all(promises);

        // Add values to field state
        if (valueWithDefault === null) {
          fieldState.value = null;
          fieldState.initialValue = null;
        } else {
          fieldState.value = blocksValue.length;
          fieldState.initialValue = blocksValue.length;

          if (blocksValue.length > 0) {
            fieldState.disableFormData = true;
          }
        }

        fieldState.rows = rowMetadata;

        // Add field to state
        state[`${path}${field.name}`] = fieldState;

        break;
      }

      case 'group': {
        await iterateFields({
          state,
          id,
          operation,
          fields: field.fields,
          data: data?.[field.name] || {},
          fullData,
          parentPassesCondition: passesCondition,
          path: `${path}${field.name}.`,
          locale,
          user,
          t,
          preferences,
        });

        break;
      }

      default: {
        fieldState.value = valueWithDefault;
        fieldState.initialValue = valueWithDefault;

        // Add field to state
        state[`${path}${field.name}`] = fieldState;

        break;
      }
    }
  } else if (fieldHasSubFields(field)) {
    // Handle field types that do not use names (row, etc)
    await iterateFields({
      state,
      fields: field.fields,
      data,
      parentPassesCondition: passesCondition,
      path,
      user,
      fullData,
      id,
      locale,
      operation,
      t,
      preferences,
    });
  } else if (field.type === 'tabs') {
    const promises = field.tabs.map((tab) => iterateFields({
      state,
      fields: tab.fields,
      data: tabHasName(tab) ? data?.[tab.name] : data,
      parentPassesCondition: passesCondition,
      path: tabHasName(tab) ? `${path}${tab.name}.` : path,
      user,
      fullData,
      id,
      locale,
      operation,
      t,
      preferences,
    }));

    await Promise.all(promises);
  }
};
