/* eslint-disable no-param-reassign */
import merge from 'deepmerge';
import { Field, fieldAffectsData, TabAsField, tabHasName } from '../../config/types';
import { Operation } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import getValueWithDefault from '../../getDefaultValue';
import { traverseFields } from './traverseFields';
import { getExistingRowDoc } from './getExistingRowDoc';
import { cloneDataFromOriginalDoc } from './cloneDataFromOriginalDoc';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  docWithLocales: Record<string, unknown>
  errors: { message: string, field: string }[]
  field: Field | TabAsField
  id?: string | number
  mergeLocaleActions: (() => void)[]
  operation: Operation
  path: string
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
  siblingDocWithLocales?: Record<string, unknown>
  skipValidation: boolean
}

// This function is responsible for the following actions, in order:
// - Run condition
// - Merge original document data into incoming data
// - Compute default values for undefined fields
// - Execute field hooks
// - Validate data
// - Transform data for storage
// - Unflatten locales

export const promise = async ({
  data,
  doc,
  docWithLocales,
  errors,
  field,
  id,
  mergeLocaleActions,
  operation,
  path,
  req,
  siblingData,
  siblingDoc,
  siblingDocWithLocales,
  skipValidation,
}: Args): Promise<void> => {
  const passesCondition = (field.admin?.condition) ? field.admin.condition(data, siblingData, { user: req.user }) : true;
  let skipValidationFromHere = skipValidation || !passesCondition;

  const defaultLocale = req.payload.config?.localization ? req.payload.config.localization?.defaultLocale : 'en';
  const operationLocale = req.locale || defaultLocale;

  if (fieldAffectsData(field)) {
    if (typeof siblingData[field.name] === 'undefined') {
      // If no incoming data, but existing document data is found, merge it in
      if (typeof siblingDoc[field.name] !== 'undefined') {
        if (field.localized && typeof siblingDocWithLocales[field.name] === 'object' && siblingDocWithLocales[field.name] !== null) {
          siblingData[field.name] = cloneDataFromOriginalDoc(siblingDocWithLocales[field.name][req.locale]);
        } else {
          siblingData[field.name] = cloneDataFromOriginalDoc(siblingDoc[field.name]);
        }

        // Otherwise compute default value
      } else if (typeof field.defaultValue !== 'undefined') {
        siblingData[field.name] = await getValueWithDefault({
          value: siblingData[field.name],
          defaultValue: field.defaultValue,
          locale: req.locale,
          user: req.user,
        });
      }
    }

    // skip validation if the field is localized and the incoming data is null
    if (field.localized && operationLocale !== defaultLocale) {
      if (['array', 'blocks'].includes(field.type) && siblingData[field.name] === null) {
        skipValidationFromHere = true;
      }
    }

    // Execute hooks
    if (field.hooks?.beforeChange) {
      await field.hooks.beforeChange.reduce(async (priorHook, currentHook) => {
        await priorHook;

        const hookedValue = await currentHook({
          value: siblingData[field.name],
          originalDoc: doc,
          data,
          siblingData,
          operation,
          req,
        });

        if (hookedValue !== undefined) {
          siblingData[field.name] = hookedValue;
        }
      }, Promise.resolve());
    }

    // Validate
    if (!skipValidationFromHere && field.validate) {
      let valueToValidate = siblingData[field.name];
      let jsonError;

      if (['array', 'blocks'].includes(field.type)) {
        const rows = siblingData[field.name];
        valueToValidate = Array.isArray(rows) ? rows.length : 0;
      }


      if (field.type === 'json' && typeof siblingData[field.name] === 'string') {
        try {
          JSON.parse(siblingData[field.name] as string);
        } catch (e) {
          jsonError = e;
        }
      }

      const validationResult = await field.validate(valueToValidate, {
        ...field,
        jsonError,
        data: merge(doc, data, { arrayMerge: (_, source) => source }),
        siblingData: merge(siblingDoc, siblingData, { arrayMerge: (_, source) => source }),
        id,
        operation,
        user: req.user,
        payload: req.payload,
        t: req.t,
      });

      if (typeof validationResult === 'string') {
        errors.push({
          message: validationResult,
          field: `${path}${field.name}`,
        });
      }
    }

    // Push merge locale action if applicable
    if (field.localized) {
      mergeLocaleActions.push(() => {
        if (req.payload.config.localization) {
          const localeData = req.payload.config.localization.locales.reduce((localizedValues, locale) => {
            const fieldValue = locale === req.locale
              ? siblingData[field.name]
              : siblingDocWithLocales?.[field.name]?.[locale];

            // update locale value if it's not undefined
            if (typeof fieldValue !== 'undefined') {
              return {
                ...localizedValues,
                [locale]: fieldValue,
              };
            }

            return localizedValues;
          }, {});

          // If there are locales with data, set the data
          if (Object.keys(localeData).length > 0) {
            siblingData[field.name] = localeData;
          }
        }
      });
    }
  }

  switch (field.type) {
    case 'point': {
      // Transform point data for storage
      if (Array.isArray(siblingData[field.name]) && siblingData[field.name][0] !== null && siblingData[field.name][1] !== null) {
        siblingData[field.name] = {
          type: 'Point',
          coordinates: [
            parseFloat(siblingData[field.name][0]),
            parseFloat(siblingData[field.name][1]),
          ],
        };
      }

      break;
    }

    case 'group': {
      if (typeof siblingData[field.name] !== 'object') siblingData[field.name] = {};
      if (typeof siblingDoc[field.name] !== 'object') siblingDoc[field.name] = {};
      if (typeof siblingDocWithLocales[field.name] !== 'object') siblingDocWithLocales[field.name] = {};

      await traverseFields({
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.fields,
        id,
        mergeLocaleActions,
        operation,
        path: `${path}${field.name}.`,
        req,
        siblingData: siblingData[field.name] as Record<string, unknown>,
        siblingDoc: siblingDoc[field.name] as Record<string, unknown>,
        siblingDocWithLocales: siblingDocWithLocales[field.name] as Record<string, unknown>,
        skipValidation: skipValidationFromHere,
      });

      break;
    }

    case 'array': {
      const rows = siblingData[field.name];

      if (Array.isArray(rows)) {
        const promises = [];
        rows.forEach((row, i) => {
          promises.push(traverseFields({
            data,
            doc,
            docWithLocales,
            errors,
            fields: field.fields,
            id,
            mergeLocaleActions,
            operation,
            path: `${path}${field.name}.${i}.`,
            req,
            siblingData: row,
            siblingDoc: getExistingRowDoc(row, siblingDoc[field.name]),
            siblingDocWithLocales: getExistingRowDoc(row, siblingDocWithLocales[field.name]),
            skipValidation: skipValidationFromHere,
          }));
        });

        await Promise.all(promises);
      }

      break;
    }

    case 'blocks': {
      const rows = siblingData[field.name];

      if (Array.isArray(rows)) {
        const promises = [];
        rows.forEach((row, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === row.blockType);

          if (block) {
            promises.push(traverseFields({
              data,
              doc,
              docWithLocales,
              errors,
              fields: block.fields,
              id,
              mergeLocaleActions,
              operation,
              path: `${path}${field.name}.${i}.`,
              req,
              siblingData: row,
              siblingDoc: getExistingRowDoc(row, siblingDoc[field.name]),
              siblingDocWithLocales: getExistingRowDoc(row, siblingDocWithLocales[field.name]),
              skipValidation: skipValidationFromHere,
            }));
          }
        });

        await Promise.all(promises);
      }

      break;
    }

    case 'row':
    case 'collapsible': {
      await traverseFields({
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.fields,
        id,
        mergeLocaleActions,
        operation,
        path,
        req,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      });

      break;
    }

    case 'tab': {
      let tabPath = path;
      let tabSiblingData = siblingData;
      let tabSiblingDoc = siblingDoc;
      let tabSiblingDocWithLocales = siblingDocWithLocales;

      if (tabHasName(field)) {
        tabPath = `${path}${field.name}.`;
        if (typeof siblingData[field.name] !== 'object') siblingData[field.name] = {};
        if (typeof siblingDoc[field.name] !== 'object') siblingDoc[field.name] = {};
        if (typeof siblingDocWithLocales[field.name] !== 'object') siblingDocWithLocales[field.name] = {};

        tabSiblingData = siblingData[field.name] as Record<string, unknown>;
        tabSiblingDoc = siblingDoc[field.name] as Record<string, unknown>;
        tabSiblingDocWithLocales = siblingDocWithLocales[field.name] as Record<string, unknown>;
      }

      await traverseFields({
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.fields,
        id,
        mergeLocaleActions,
        operation,
        path: tabPath,
        req,
        siblingData: tabSiblingData,
        siblingDoc: tabSiblingDoc,
        siblingDocWithLocales: tabSiblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      });

      break;
    }

    case 'tabs': {
      await traverseFields({
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        id,
        mergeLocaleActions,
        operation,
        path,
        req,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      });

      break;
    }

    default: {
      break;
    }
  }
};
