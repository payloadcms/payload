import validationPromise from './validationPromise';
import accessPromise from './accessPromise';
import hookPromise from './hookPromise';
import { Field, fieldHasSubFields, fieldIsArrayType, fieldIsBlockType, HookName } from './config/types';
import { Operation } from '../types';
import { PayloadRequest } from '../express/types';
import { Payload } from '..';

type Arguments = {
  fields: Field[]
  data: Record<string, any>
  originalDoc: Record<string, any>
  path: string
  reduceLocales: boolean
  locale: string
  fallbackLocale: string
  accessPromises: Promise<void>[]
  operation: Operation
  overrideAccess: boolean
  req: PayloadRequest
  id?: string
  relationshipPopulations: (() => Promise<void>)[]
  depth: number
  currentDepth: number
  hook: HookName
  hookPromises: Promise<void>[]
  fullOriginalDoc: Record<string, any>
  fullData: Record<string, any>
  validationPromises: (() => Promise<string | boolean>)[]
  errors: {message: string, field: string}[]
  payload: Payload
  showHiddenFields: boolean
}

const traverseFields = (args: Arguments): void => {
  const {
    fields,
    data = {},
    originalDoc = {},
    path,
    reduceLocales,
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
    validationPromises,
    errors,
    payload,
    showHiddenFields,
  } = args;

  fields.forEach((field) => {
    const dataCopy = data;

    if (operation === 'read' && field.hidden && typeof data[field.name] !== 'undefined' && !showHiddenFields) {
      delete data[field.name];
    }

    if ((field.type === 'upload' || field.type === 'relationship')
    && (data[field.name] === '' || data[field.name] === 'none' || data[field.name] === 'null')) {
      dataCopy[field.name] = null;
    }

    if (field.type === 'checkbox') {
      if (data[field.name] === 'true') dataCopy[field.name] = true;
      if (data[field.name] === 'false') dataCopy[field.name] = false;
      if (data[field.name] === '') dataCopy[field.name] = false;
    }

    if (field.type === 'richText' && typeof data[field.name] === 'string') {
      dataCopy[field.name] = JSON.parse(data[field.name] as string);
    }

    const hasLocalizedValue = (typeof data?.[field.name] === 'object' && data?.[field.name] !== null)
      && field.name
      && field.localized
      && locale !== 'all'
      && reduceLocales;

    if (hasLocalizedValue) {
      let localizedValue = data[field.name][locale];
      if (typeof localizedValue === 'undefined' && fallbackLocale) localizedValue = data[field.name][fallbackLocale];
      if (typeof localizedValue === 'undefined') localizedValue = null;
      dataCopy[field.name] = localizedValue;
    }

    accessPromises.push(accessPromise({
      data,
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
    }));

    hookPromises.push(hookPromise({
      data,
      field,
      hook,
      req,
      operation,
      fullOriginalDoc,
      fullData,
    }));

    if (fieldHasSubFields(field)) {
      if (field.name === undefined) {
        traverseFields({
          ...args,
          fields: field.fields,
        });
      } else if (fieldIsArrayType(field)) {
        if (Array.isArray(data[field.name])) {
          (data[field.name] as Record<string, unknown>[]).forEach((rowData, i) => {
            const originalDocRow = originalDoc && originalDoc[field.name] && originalDoc[field.name][i];
            traverseFields({
              ...args,
              fields: field.fields,
              data: rowData,
              originalDoc: originalDocRow || undefined,
              path: `${path}${field.name}.${i}.`,
            });
          });
        }
      } else {
        traverseFields({
          ...args,
          fields: field.fields,
          data: data[field.name] as Record<string, unknown>,
          originalDoc: originalDoc[field.name],
          path: `${path}${field.name}.`,
        });
      }
    }

    if (fieldIsBlockType(field)) {
      if (Array.isArray(data[field.name])) {
        (data[field.name] as Record<string, unknown>[]).forEach((rowData, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === rowData.blockType);
          const originalDocRow = originalDoc && originalDoc[field.name] && originalDoc[field.name][i];

          if (block) {
            traverseFields({
              ...args,
              fields: block.fields,
              data: rowData,
              originalDoc: originalDocRow || undefined,
              path: `${path}${field.name}.${i}.`,
            });
          }
        });
      }
    }

    if ((operation === 'create' || operation === 'update') && field.name) {
      const updatedData = data;

      if (data[field.name] === undefined && originalDoc[field.name] === undefined && field.defaultValue) {
        updatedData[field.name] = field.defaultValue;
      }

      if (field.type === 'array' || field.type === 'blocks') {
        const hasRowsOfNewData = Array.isArray(data[field.name]);
        const newRowCount = hasRowsOfNewData ? (data[field.name] as Record<string, unknown>[]).length : 0;

        // Handle cases of arrays being intentionally set to 0
        if (data[field.name] === '0' || data[field.name] === 0 || data[field.name] === null) {
          updatedData[field.name] = [];
        }

        const hasRowsOfExistingData = Array.isArray(originalDoc[field.name]);
        const existingRowCount = hasRowsOfExistingData ? originalDoc[field.name].length : 0;

        validationPromises.push(() => validationPromise({
          errors,
          hook,
          newData: { [field.name]: newRowCount },
          existingData: { [field.name]: existingRowCount },
          field,
          path,
        }));
      } else {
        validationPromises.push(() => validationPromise({
          errors,
          hook,
          newData: data,
          existingData: originalDoc,
          field,
          path,
        }));
      }
    }
  });
};

export default traverseFields;
