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
  flattenLocales: boolean
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
  unflattenLocales: boolean
  unflattenLocaleActions: (() => void)[]
  docWithLocales?: Record<string, any>
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
    validationPromises,
    errors,
    payload,
    showHiddenFields,
    unflattenLocaleActions,
    unflattenLocales,
    docWithLocales = {},
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

    if (field.type === 'relationship' && field.hasMany && (data[field.name]?.[0] === '' || data[field.name]?.[0] === 'none' || data[field.name]?.[0] === 'null')) {
      dataCopy[field.name] = [];
    }

    if (field.type === 'number' && typeof data[field.name] === 'string') {
      dataCopy[field.name] = parseFloat(data[field.name]);
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
      && flattenLocales;

    if (hasLocalizedValue) {
      let localizedValue = data[field.name][locale];
      if (typeof localizedValue === 'undefined' && fallbackLocale) localizedValue = data[field.name][fallbackLocale];
      if (typeof localizedValue === 'undefined') localizedValue = null;
      dataCopy[field.name] = localizedValue;
    }

    if (field.localized && unflattenLocales) {
      unflattenLocaleActions.push(() => {
        const localeData = payload.config.localization.locales.reduce((locales, localeID) => {
          let valueToSet;

          if (localeID === locale) {
            if (data[field.name]) {
              valueToSet = data[field.name];
            } else if (docWithLocales?.[field.name]?.[localeID]) {
              valueToSet = docWithLocales?.[field.name]?.[localeID];
            }
          } else {
            valueToSet = docWithLocales?.[field.name]?.[localeID];
          }

          if (valueToSet) {
            return {
              ...locales,
              [localeID]: valueToSet,
            };
          }

          return locales;
        }, {});

        // If there are locales with data, set the data
        if (Object.keys(localeData).length > 0) {
          data[field.name] = localeData;
        }
      });
    }

    accessPromises.push(accessPromise({
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
            });
          }
        });
      }
    }

    if (hook === 'beforeChange' && field.name) {
      const updatedData = data;

      if (data?.[field.name] === undefined && originalDoc?.[field.name] === undefined && field.defaultValue) {
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
