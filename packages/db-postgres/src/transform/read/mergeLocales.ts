/* eslint-disable no-param-reassign */
import { FieldAffectingData, UIField, fieldAffectsData } from 'payload/dist/fields/config/types';
import { Field } from 'payload/types';
import flattenTopLevelFields from 'payload/dist/utilities/flattenTopLevelFields';

type TraverseFieldsArgs = {
  dataRef?: Record<string, unknown>
  fields: (UIField | FieldAffectingData)[]
  parentIsLocalized?: boolean
  localeRow: Record<string, unknown>
  prefix?: string
}

const traverseFields = ({
  dataRef,
  fields,
  parentIsLocalized,
  localeRow,
  prefix,
}: TraverseFieldsArgs) => {
  const locale = localeRow._locale;

  if (typeof locale === 'string') {
    fields.forEach((field) => {
      if (fieldAffectsData(field) && (field.localized || parentIsLocalized)) {
        switch (field.type) {
          // TODO: handle named tabs
          case 'group': {
            const flattenedFields = flattenTopLevelFields(field.fields);
            if (!dataRef[field.name]) dataRef[field.name] = {};
            if (!dataRef[field.name][locale]) dataRef[field.name][locale] = {};

            traverseFields({
              dataRef: dataRef[field.name][locale] as Record<string, unknown>,
              fields: flattenedFields,
              parentIsLocalized: true,
              localeRow,
              prefix: `${prefix || ''}${field.name}_`,
            });

            break;
          }

          default: {
            const localeData = localeRow[`${prefix}${field.name}`];

            if (parentIsLocalized) {
              dataRef[field.name] = localeData;
            } else {
              if (typeof dataRef[field.name] !== 'object') dataRef[field.name] = {};
              dataRef[field.name][locale] = localeData;
            }
          }
        }
      }
    });
  }
};

type MergeLocalesArgs = {
  fields: Field[]
  table: Record<string, unknown>
}

// Merge _locales into the parent data
export const mergeLocales = ({
  fields,
  table,
}: MergeLocalesArgs): Record<string, unknown> => {
  const localeRows = table._locales;
  const flattenedFields = flattenTopLevelFields(fields);

  if (Array.isArray(localeRows)) {
    localeRows.forEach((localeRow) => {
      traverseFields({
        dataRef: table,
        fields: flattenedFields,
        localeRow,
      });
    });
  }

  delete table._locales;

  return table;
};
