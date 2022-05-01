import accessPromise from './accessPromise';
import hookPromise from './hookPromise';
import {
  Field,
  fieldHasSubFields,
  fieldIsArrayType,
  fieldIsBlockType,
  fieldAffectsData,
  HookName,
} from './config/types';
import { Operation } from '../types';
import { PayloadRequest } from '../express/types';
import { Payload } from '..';
import richTextRelationshipPromise from './richText/relationshipPromise';

type Arguments = {
  fields: Field[]
  data: Record<string, any>
  originalDoc: Record<string, any>
  path: string
  flattenLocales: boolean
  locale: string
  fallbackLocale: string
  accessPromises: (() => Promise<void>)[]
  operation: Operation
  overrideAccess: boolean
  req: PayloadRequest
  id?: string | number
  relationshipPopulations: (() => Promise<void>)[]
  depth: number
  currentDepth: number
  hook: HookName
  hookPromises: (() => Promise<void>)[]
  fullOriginalDoc: Record<string, any>
  fullData: Record<string, any>
  payload: Payload
  showHiddenFields: boolean
  transformActions: (() => void)[]
  docWithLocales?: Record<string, any>
  skipValidation?: boolean
  isVersion: boolean
}

const traverseFields = (args: Arguments): void => {
  const {
    fields,
    data = {},
    originalDoc = {},
    path,
    flattenLocales,
    locale,
    fallbackLocale,
    accessPromises,
    operation,
    overrideAccess,
    req,
    id,
    relationshipPopulations,
    depth,
    currentDepth,
    hook,
    hookPromises,
    fullOriginalDoc,
    fullData,
    payload,
    showHiddenFields,
    transformActions,
    docWithLocales = {},
    skipValidation,
    isVersion,
  } = args;

  fields.forEach((field) => {
    const dataCopy = data;

    if (hook === 'afterRead') {
      if (field.type === 'group') {
        // Fill groups with empty objects so fields with hooks within groups can populate
        // themselves virtually as necessary
        if (typeof data[field.name] === 'undefined' && typeof originalDoc[field.name] === 'undefined') {
          data[field.name] = {};
        }
      }

      if (fieldAffectsData(field) && field.hidden && typeof data[field.name] !== 'undefined' && !showHiddenFields) {
        delete data[field.name];
      }

      if (field.type === 'point') {
        transformActions.push(() => {
          if (data[field.name]?.coordinates && Array.isArray(data[field.name].coordinates) && data[field.name].coordinates.length === 2) {
            data[field.name] = data[field.name].coordinates;
          }
        });
      }
    }

    if (field.type === 'richText') {
      if (((field.admin?.elements?.includes('relationship') || field.admin?.elements?.includes('upload')) || !field?.admin?.elements) && hook === 'afterRead') {
        relationshipPopulations.push(richTextRelationshipPromise({
          req,
          data,
          payload,
          overrideAccess,
          depth,
          field,
          currentDepth,
          showHiddenFields,
        }));
      }
    }

    const hasLocalizedValue = fieldAffectsData(field)
      && (typeof data?.[field.name] === 'object' && data?.[field.name] !== null)
      && field.name
      && field.localized
      && locale !== 'all'
      && flattenLocales;

    if (hasLocalizedValue) {
      let localizedValue = data[field.name][locale];
      if (typeof localizedValue === 'undefined' && fallbackLocale) localizedValue = data[field.name][fallbackLocale];
      if (typeof localizedValue === 'undefined' && field.type === 'group') localizedValue = {};
      if (typeof localizedValue === 'undefined') localizedValue = null;
      dataCopy[field.name] = localizedValue;
    }

    if (fieldAffectsData(field)) {
      accessPromises.push(() => accessPromise({
        data,
        fullData,
        originalDoc,
        field,
        operation,
        overrideAccess,
        req,
        id,
        relationshipPopulations,
        depth,
        currentDepth,
        hook,
        payload,
        showHiddenFields,
      }));

      hookPromises.push(() => hookPromise({
        data,
        field,
        hook,
        req,
        operation,
        fullOriginalDoc,
        fullData,
        flattenLocales,
        isVersion,
      }));
    }


    const passesCondition = true;
    const skipValidationFromHere = skipValidation || !passesCondition;

    if (fieldHasSubFields(field)) {
      if (!fieldAffectsData(field)) {
        traverseFields({
          ...args,
          fields: field.fields,
          skipValidation: skipValidationFromHere,
        });
      } else if (fieldIsArrayType(field)) {
        if (Array.isArray(data[field.name])) {
          for (let i = 0; i < data[field.name].length; i += 1) {
            if (typeof (data[field.name][i]) === 'undefined') {
              data[field.name][i] = {};
            }

            traverseFields({
              ...args,
              fields: field.fields,
              data: data[field.name][i] || {},
              originalDoc: originalDoc?.[field.name]?.[i],
              docWithLocales: docWithLocales?.[field.name]?.[i],
              path: `${path}${field.name}.${i}.`,
              skipValidation: skipValidationFromHere,
              showHiddenFields,
            });
          }
        }
      } else {
        traverseFields({
          ...args,
          fields: field.fields,
          data: data[field.name] as Record<string, unknown>,
          originalDoc: originalDoc[field.name],
          docWithLocales: docWithLocales?.[field.name],
          path: `${path}${field.name}.`,
          skipValidation: skipValidationFromHere,
          showHiddenFields,
        });
      }
    }

    if (fieldIsBlockType(field)) {
      if (Array.isArray(data[field.name])) {
        (data[field.name] as Record<string, unknown>[]).forEach((rowData, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === rowData.blockType);

          if (block) {
            traverseFields({
              ...args,
              fields: block.fields,
              data: rowData || {},
              originalDoc: originalDoc?.[field.name]?.[i],
              docWithLocales: docWithLocales?.[field.name]?.[i],
              path: `${path}${field.name}.${i}.`,
              skipValidation: skipValidationFromHere,
              showHiddenFields,
            });
          }
        });
      }
    }
  });
};

export default traverseFields;
