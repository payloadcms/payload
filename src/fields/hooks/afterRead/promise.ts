/* eslint-disable no-param-reassign */
import { Field, fieldAffectsData, TabAsField, tabHasName } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
import { traverseFields } from './traverseFields';
import richTextRelationshipPromise from '../../richText/richTextRelationshipPromise';
import relationshipPopulationPromise from './relationshipPopulationPromise';

type Args = {
  currentDepth: number
  depth: number
  doc: Record<string, unknown>
  field: Field | TabAsField
  fieldPromises: Promise<void>[]
  findMany: boolean
  flattenLocales: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  overrideAccess: boolean
  siblingDoc: Record<string, unknown>
  showHiddenFields: boolean
}

// This function is responsible for the following actions, in order:
// - Remove hidden fields from response
// - Flatten locales into requested locale
// - Sanitize outgoing data (point field, etc)
// - Execute field hooks
// - Execute read access control
// - Populate relationships

export const promise = async ({
  currentDepth,
  depth,
  doc,
  field,
  fieldPromises,
  findMany,
  flattenLocales,
  overrideAccess,
  populationPromises,
  req,
  siblingDoc,
  showHiddenFields,
}: Args): Promise<void> => {
  if (fieldAffectsData(field) && field.hidden && typeof siblingDoc[field.name] !== 'undefined' && !showHiddenFields) {
    delete siblingDoc[field.name];
  }

  const shouldHoistLocalizedValue = flattenLocales
    && fieldAffectsData(field)
    && (typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null)
    && field.localized
    && req.locale !== 'all'
    && req.payload.config.localization;

  if (shouldHoistLocalizedValue) {
    // replace actual value with localized value before sanitizing
    // { [locale]: fields } -> fields
    const { locale } = req;
    const value = siblingDoc[field.name][locale];
    const fallbackLocale = req.payload.config.localization && req.payload.config.localization?.fallback && req.fallbackLocale;

    let hoistedValue = value;

    if (fallbackLocale && fallbackLocale !== locale) {
      const fallbackValue = siblingDoc[field.name][fallbackLocale];
      const isNullOrUndefined = typeof value === 'undefined' || value === null;

      if (fallbackValue) {
        switch (field.type) {
          case 'text':
          case 'textarea': {
            if (value === '' || isNullOrUndefined) {
              hoistedValue = fallbackValue;
            }
            break;
          }

          default: {
            if (isNullOrUndefined) {
              hoistedValue = fallbackValue;
            }
            break;
          }
        }
      }
    }

    siblingDoc[field.name] = hoistedValue;
  }

  // Sanitize outgoing field value
  switch (field.type) {
    case 'group': {
      // Fill groups with empty objects so fields with hooks within groups can populate
      // themselves virtually as necessary
      if (typeof siblingDoc[field.name] === 'undefined') {
        siblingDoc[field.name] = {};
      }

      break;
    }
    case 'tabs': {
      field.tabs.forEach((tab) => {
        if (tabHasName(tab) && (typeof siblingDoc[tab.name] === 'undefined' || siblingDoc[tab.name] === null)) {
          siblingDoc[tab.name] = {};
        }
      });

      break;
    }

    case 'richText': {
      if (((field.admin?.elements?.includes('relationship') || field.admin?.elements?.includes('upload') || field.admin?.elements?.includes('link')) || !field?.admin?.elements)) {
        populationPromises.push(richTextRelationshipPromise({
          currentDepth,
          depth,
          field,
          overrideAccess,
          req,
          siblingDoc,
          showHiddenFields,
        }));
      }

      break;
    }

    case 'point': {
      const pointDoc = siblingDoc[field.name] as Record<string, unknown>;
      if (Array.isArray(pointDoc?.coordinates) && pointDoc.coordinates.length === 2) {
        siblingDoc[field.name] = pointDoc.coordinates;
      }

      break;
    }

    default: {
      break;
    }
  }

  if (fieldAffectsData(field)) {
    // Execute hooks
    if (field.hooks?.afterRead) {
      await field.hooks.afterRead.reduce(async (priorHook, currentHook) => {
        await priorHook;

        const shouldRunHookOnAllLocales = field.localized
          && (req.locale === 'all' || !flattenLocales)
          && typeof siblingDoc[field.name] === 'object';

        if (shouldRunHookOnAllLocales) {
          const hookPromises = Object.entries(siblingDoc[field.name]).map(([locale, value]) => (async () => {
            const hookedValue = await currentHook({
              value,
              originalDoc: doc,
              data: doc,
              siblingData: siblingDoc,
              operation: 'read',
              req,
            });

            if (hookedValue !== undefined) {
              siblingDoc[field.name][locale] = hookedValue;
            }
          })());

          await Promise.all(hookPromises);
        } else {
          const hookedValue = await currentHook({
            data: doc,
            findMany,
            originalDoc: doc,
            operation: 'read',
            siblingData: siblingDoc,
            req,
            value: siblingDoc[field.name],
          });

          if (hookedValue !== undefined) {
            siblingDoc[field.name] = hookedValue;
          }
        }
      }, Promise.resolve());
    }

    // Execute access control
    if (field.access && field.access.read) {
      const result = overrideAccess ? true : await field.access.read({ req, id: doc.id as string | number, siblingData: siblingDoc, data: doc, doc });

      if (!result) {
        delete siblingDoc[field.name];
      }
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      populationPromises.push(relationshipPopulationPromise({
        currentDepth,
        depth,
        field,
        overrideAccess,
        req,
        showHiddenFields,
        siblingDoc,
      }));
    }
  }

  switch (field.type) {
    case 'group': {
      let groupDoc = siblingDoc[field.name] as Record<string, unknown>;
      if (typeof siblingDoc[field.name] !== 'object') groupDoc = {};

      traverseFields({
        currentDepth,
        depth,
        doc,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        req,
        siblingDoc: groupDoc,
        showHiddenFields,
      });

      break;
    }

    case 'array': {
      const rows = siblingDoc[field.name];

      if (Array.isArray(rows)) {
        rows.forEach((row) => {
          traverseFields({
            currentDepth,
            depth,
            doc,
            fields: field.fields,
            fieldPromises,
            findMany,
            flattenLocales,
            overrideAccess,
            populationPromises,
            req,
            siblingDoc: row || {},
            showHiddenFields,
          });
        });
      }
      break;
    }

    case 'blocks': {
      const rows = siblingDoc[field.name];

      if (Array.isArray(rows)) {
        rows.forEach((row) => {
          const block = field.blocks.find((blockType) => blockType.slug === row.blockType);

          if (block) {
            traverseFields({
              currentDepth,
              depth,
              doc,
              fields: block.fields,
              fieldPromises,
              findMany,
              flattenLocales,
              overrideAccess,
              populationPromises,
              req,
              siblingDoc: row || {},
              showHiddenFields,
            });
          }
        });
      }

      break;
    }

    case 'row':
    case 'collapsible': {
      traverseFields({
        currentDepth,
        depth,
        doc,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        req,
        siblingDoc,
        showHiddenFields,
      });

      break;
    }

    case 'tab': {
      let tabDoc = siblingDoc;
      if (tabHasName(field)) {
        tabDoc = siblingDoc[field.name] as Record<string, unknown>;
        if (typeof siblingDoc[field.name] !== 'object') tabDoc = {};
      }

      await traverseFields({
        currentDepth,
        depth,
        doc,
        fieldPromises,
        fields: field.fields,
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        req,
        siblingDoc: tabDoc,
        showHiddenFields,
      });

      break;
    }

    case 'tabs': {
      traverseFields({
        currentDepth,
        depth,
        doc,
        fieldPromises,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        req,
        siblingDoc,
        showHiddenFields,
      });
      break;
    }

    default: {
      break;
    }
  }
};
