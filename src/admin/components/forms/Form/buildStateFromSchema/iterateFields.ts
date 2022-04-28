import ObjectID from 'bson-objectid';
import { User } from '../../../../../auth';
import {
  Field as FieldSchema,
  fieldAffectsData,
  FieldAffectingData,
  fieldIsPresentationalOnly,
} from '../../../../../fields/config/types';
import { Fields, Data } from '../types';
import { structureFieldState } from './structureFieldState';

type Args = {
  fields: FieldSchema[]
  data: Data
  fullData: Data
  parentPassesCondition: boolean
  path: string
  user: User
  locale: string
  valuePromises: (() => Promise<void>)[]
  validationPromises: (() => Promise<void>)[]
  id: string | number
  operation: 'create' | 'update'
}

export const iterateFields = ({
  fields,
  data,
  parentPassesCondition,
  path = '',
  fullData,
  user,
  locale,
  operation,
  valuePromises,
  validationPromises,
  id,
}: Args): Fields => fields.reduce((state, field) => {
  const initialData = data;

  if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
    // if (fieldAffectsData(field) && field.defaultValue && typeof initialData?.[field.name] === 'undefined') {
    //   initialData = { [field.name]: field.defaultValue };
    // }

    const passesCondition = Boolean((field?.admin?.condition ? field.admin.condition(fullData || {}, initialData || {}) : true) && parentPassesCondition);

    if (fieldAffectsData(field)) {
      if (field.type === 'relationship' && initialData?.[field.name] === null) {
        initialData[field.name] = 'null';
      }

      if (field.type === 'array' || field.type === 'blocks') {
        if (Array.isArray(initialData?.[field.name])) {
          const rows = initialData[field.name] as Data[];

          if (field.type === 'array') {
            // return {
            //   ...state,
            //   ...rows.reduce((rowState, row, i) => {
            //     const rowPath = `${path}${field.name}.${i}.`;
            //
            //     return {
            //       ...rowState,
            //       [`${rowPath}id`]: {
            //         value: row.id,
            //         initialValue: row.id || new ObjectID().toHexString(),
            //         valid: true,
            //       },
            //       ...iterateFields({
            //         fields: field.fields,
            //         data: row,
            //         fullData,
            //         parentPassesCondition: passesCondition,
            //         path: rowPath,
            //         locale,
            //         user,
            //         valuePromises,
            //         validationPromises,
            //         id,
            //         operation,
            //       }),
            //     };
            //   },
            //   {}),
            // };
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
                  ...(block?.fields ? iterateFields({
                    fields: block.fields,
                    data: row,
                    fullData,
                    parentPassesCondition: passesCondition,
                    path: rowPath,
                    locale,
                    user,
                    id,
                    operation,
                    validationPromises,
                    valuePromises,
                  }) : {}),
                };
              }, {}),
            };
          }
        } else if (field.defaultValue) {
          // return {
          //   ...state,
          //   [`${path}${field.name}`]: structureFieldState({
          //     field,
          //     passesCondition,
          //     data,
          //     fullData,
          //     locale,
          //     user,
          //     valuePromises,
          //     validationPromises,
          //     id,
          //     operation,
          //     state,
          //     path,
          //   }),
          // };
        }

        // return state;
      }

      // Handle non-array-based nested fields (group, etc)
      if (field.type === 'group') {
        const subFieldData = initialData?.[field.name] as Data;

        return {
          ...state,
          ...iterateFields({
            id,
            operation,
            validationPromises,
            valuePromises,
            fields: field.fields,
            data: subFieldData,
            fullData,
            parentPassesCondition: passesCondition,
            path: `${path}${field.name}.`,
            locale,
            user,
          }),
        };
      }

      return {
        ...state,
        [`${path}${field.name}`]: structureFieldState({
          fullData,
          id,
          locale,
          operation,
          path,
          state,
          user,
          validationPromises,
          valuePromises,
          field,
          passesCondition,
          data,
        }),
      };
    }

    // Handle field types that do not use names (row, etc)
    if (field.type === 'row') {
      return {
        ...state,
        ...iterateFields({
          fields: field.fields,
          data,
          fullData,
          parentPassesCondition: passesCondition,
          path,
          locale,
          user,
          id,
          operation,
          validationPromises,
          valuePromises,
        }),
      };
    }

    const namedField = field as FieldAffectingData;

    // Handle normal fields
    return {
      ...state,
      [`${path}${namedField.name}`]: structureFieldState({
        fullData,
        id,
        locale,
        operation,
        path,
        state,
        user,
        validationPromises,
        valuePromises,
        field,
        passesCondition,
        data,
      }),
    };
  }

  return state;
}, {});
