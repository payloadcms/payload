import validationPromise from './validationPromise';
import accessPromise from './accessPromise';
import hookPromise from './hookPromise';
import { Field, fieldHasSubFields, fieldIsArrayType, fieldIsBlockType, fieldAffectsData, HookName } from './config/types';
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
  validationPromises: (() => Promise<string | boolean>)[]
  errors: { message: string, field: string }[]
  payload: Payload
  showHiddenFields: boolean
  unflattenLocales: boolean
  unflattenLocaleActions: (() => void)[]
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
    validationPromises,
    errors,
    payload,
    showHiddenFields,
    unflattenLocaleActions,
    unflattenLocales,
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

    if ((field.type === 'upload' || field.type === 'relationship')
      && (data[field.name] === '' || data[field.name] === 'none' || data[field.name] === 'null')) {
      if (field.type === 'relationship' && field.hasMany === true) {
        dataCopy[field.name] = [];
      } else {
        dataCopy[field.name] = null;
      }
    }

    if (field.type === 'relationship' && field.hasMany && (data[field.name] === '' || data[field.name] === 'none' || data[field.name] === 'null')) {
      dataCopy[field.name] = [];
    }

    if (field.type === 'number' && typeof data[field.name] === 'string') {
      const trimmed = data[field.name].trim();
      dataCopy[field.name] = (trimmed.length === 0) ? null : parseFloat(trimmed);
    }

    if (fieldAffectsData(field) && field.name === 'id') {
      if (field.type === 'number' && typeof data[field.name] === 'string') {
        dataCopy[field.name] = parseFloat(data[field.name]);
      }
      if (field.type === 'text' && typeof data[field.name]?.toString === 'function' && typeof data[field.name] !== 'string') {
        dataCopy[field.name] = dataCopy[field.name].toString();
      }
    }

    if (field.type === 'checkbox') {
      if (data[field.name] === 'true') dataCopy[field.name] = true;
      if (data[field.name] === 'false') dataCopy[field.name] = false;
      if (data[field.name] === '') dataCopy[field.name] = false;
    }

    if (field.type === 'richText') {
      if (typeof data[field.name] === 'string') {
        try {
          const richTextJSON = JSON.parse(data[field.name] as string);
          dataCopy[field.name] = richTextJSON;
        } catch {
          // Disregard this data as it is not valid.
          // Will be reported to user by field validation
        }
      }

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

    if (fieldAffectsData(field) && field.localized && unflattenLocales) {
      unflattenLocaleActions.push(() => {
        const localeData = payload.config.localization.locales.reduce((locales, localeID) => {
          let valueToSet;

          if (localeID === locale) {
            if (typeof data[field.name] !== 'undefined') {
              valueToSet = data[field.name];
            } else if (docWithLocales?.[field.name]?.[localeID]) {
              valueToSet = docWithLocales?.[field.name]?.[localeID];
            }
          } else {
            valueToSet = docWithLocales?.[field.name]?.[localeID];
          }

          if (typeof valueToSet !== 'undefined') {
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


    const passesCondition = (field.admin?.condition && hook === 'beforeChange') ? field.admin.condition(fullData, data) : true;
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

    if (hook === 'beforeChange' && fieldAffectsData(field)) {
      const updatedData = data;

      if (data?.[field.name] === undefined && originalDoc?.[field.name] === undefined && field.defaultValue) {
        updatedData[field.name] = field.defaultValue;
      }

      if (field.type === 'relationship' || field.type === 'upload') {
        if (Array.isArray(field.relationTo)) {
          if (Array.isArray(dataCopy[field.name])) {
            dataCopy[field.name].forEach((relatedDoc: { value: unknown, relationTo: string }, i) => {
              const relatedCollection = payload.config.collections.find((collection) => collection.slug === relatedDoc.relationTo);
              const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
              if (relationshipIDField?.type === 'number') {
                dataCopy[field.name][i] = { ...relatedDoc, value: parseFloat(relatedDoc.value as string) };
              }
            });
          }
          if (field.type === 'relationship' && field.hasMany !== true && dataCopy[field.name]?.relationTo) {
            const relatedCollection = payload.config.collections.find((collection) => collection.slug === dataCopy[field.name].relationTo);
            const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
            if (relationshipIDField?.type === 'number') {
              dataCopy[field.name] = { ...dataCopy[field.name], value: parseFloat(dataCopy[field.name].value as string) };
            }
          }
        } else {
          if (Array.isArray(dataCopy[field.name])) {
            dataCopy[field.name].forEach((relatedDoc: unknown, i) => {
              const relatedCollection = payload.config.collections.find((collection) => collection.slug === field.relationTo);
              const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
              if (relationshipIDField?.type === 'number') {
                dataCopy[field.name][i] = parseFloat(relatedDoc as string);
              }
            });
          }
          if (field.type === 'relationship' && field.hasMany !== true && dataCopy[field.name]) {
            const relatedCollection = payload.config.collections.find((collection) => collection.slug === field.relationTo);
            const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
            if (relationshipIDField?.type === 'number') {
              dataCopy[field.name] = parseFloat(dataCopy[field.name]);
            }
          }
        }
      }

      if (field.type === 'point' && data[field.name]) {
        transformActions.push(() => {
          if (Array.isArray(data[field.name]) && data[field.name][0] !== null && data[field.name][1] !== null) {
            data[field.name] = {
              type: 'Point',
              coordinates: [
                parseFloat(data[field.name][0]),
                parseFloat(data[field.name][1]),
              ],
            };
          }
        });
      }

      if (field.type === 'array' || field.type === 'blocks') {
        const hasRowsOfNewData = Array.isArray(data[field.name]);
        const newRowCount = hasRowsOfNewData ? (data[field.name] as Record<string, unknown>[]).length : undefined;

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
          skipValidation: skipValidationFromHere,
        }));
      } else if (fieldAffectsData(field)) {
        validationPromises.push(() => validationPromise({
          errors,
          hook,
          newData: data,
          existingData: originalDoc,
          field,
          path,
          skipValidation: skipValidationFromHere,
        }));
      }
    }
  });
};

export default traverseFields;
