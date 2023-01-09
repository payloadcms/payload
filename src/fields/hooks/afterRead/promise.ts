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

  const hasLocalizedValue = flattenLocales
    && fieldAffectsData(field)
    && (typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null)
    && field.localized
    && req.locale !== 'all';

  if (hasLocalizedValue) {
    let localizedValue = siblingDoc[field.name][req.locale];
    if (typeof localizedValue === 'undefined' && req.fallbackLocale) localizedValue = siblingDoc[field.name][req.fallbackLocale];
    if (localizedValue === null && (field.type === 'array' || field.type === 'blocks')) localizedValue = siblingDoc[field.name][req.fallbackLocale];
    if (typeof localizedValue === 'undefined' && (field.type === 'group' || field.type === 'tab')) localizedValue = {};
    if (typeof localizedValue === 'undefined') localizedValue = null;
    siblingDoc[field.name] = localizedValue;
  }

  // Sanitize outgoing data
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
        if (tabHasName(tab) && typeof siblingDoc[tab.name] === 'undefined') {
          siblingDoc[tab.name] = {};
        }
      });

      break;
    }

    case 'richText': {
      if (((field.admin?.elements?.includes('relationship') || field.admin?.elements?.includes('upload')) || !field?.admin?.elements)) {
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
