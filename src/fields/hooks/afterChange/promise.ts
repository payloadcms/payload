/* eslint-disable no-param-reassign */
import { PayloadRequest, RequestContext } from '../../../express/types';
import { Field, fieldAffectsData, TabAsField, tabHasName } from '../../config/types';
import { traverseFields } from './traverseFields';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  previousDoc: Record<string, unknown>
  previousSiblingDoc: Record<string, unknown>
  field: Field | TabAsField
  operation: 'create' | 'update'
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
  context: RequestContext
}

// This function is responsible for the following actions, in order:
// - Execute field hooks

export const promise = async ({
  data,
  doc,
  previousDoc,
  previousSiblingDoc,
  field,
  operation,
  req,
  siblingData,
  siblingDoc,
  context,
}: Args): Promise<void> => {
  if (fieldAffectsData(field)) {
    // Execute hooks
    if (field.hooks?.afterChange) {
      await field.hooks.afterChange.reduce(async (priorHook, currentHook) => {
        await priorHook;

        const hookedValue = await currentHook({
          value: siblingData[field.name],
          originalDoc: doc,
          previousDoc,
          previousSiblingDoc,
          previousValue: previousDoc[field.name],
          data,
          siblingData,
          operation,
          req,
          context,
        });

        if (hookedValue !== undefined) {
          siblingDoc[field.name] = hookedValue;
        }
      }, Promise.resolve());
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'group': {
      await traverseFields({
        data,
        doc,
        previousDoc,
        previousSiblingDoc: previousDoc[field.name] as Record<string, unknown>,
        fields: field.fields,
        operation,
        req,
        siblingData: siblingData?.[field.name] as Record<string, unknown> || {},
        siblingDoc: siblingDoc[field.name] as Record<string, unknown>,
        context,
      });

      break;
    }

    case 'array': {
      const rows = siblingDoc[field.name];

      if (Array.isArray(rows)) {
        const promises = [];
        rows.forEach((row, i) => {
          promises.push(traverseFields({
            data,
            doc,
            previousDoc,
            previousSiblingDoc: previousDoc?.[field.name]?.[i] || {} as Record<string, unknown>,
            fields: field.fields,
            operation,
            req,
            siblingData: siblingData?.[field.name]?.[i] || {},
            siblingDoc: { ...row } || {},
            context,
          }));
        });
        await Promise.all(promises);
      }
      break;
    }

    case 'blocks': {
      const rows = siblingDoc[field.name];

      if (Array.isArray(rows)) {
        const promises = [];
        rows.forEach((row, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === row.blockType);

          if (block) {
            promises.push(traverseFields({
              data,
              doc,
              previousDoc,
              previousSiblingDoc: previousDoc?.[field.name]?.[i] || {} as Record<string, unknown>,
              fields: block.fields,
              operation,
              req,
              siblingData: siblingData?.[field.name]?.[i] || {},
              siblingDoc: { ...row } || {},
              context,
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
        previousDoc,
        previousSiblingDoc: { ...previousSiblingDoc },
        fields: field.fields,
        operation,
        req,
        siblingData: siblingData || {},
        siblingDoc: { ...siblingDoc },
        context,
      });

      break;
    }

    case 'tab': {
      let tabSiblingData = siblingData;
      let tabSiblingDoc = siblingDoc;
      let tabPreviousSiblingDoc = siblingDoc;

      if (tabHasName(field)) {
        tabSiblingData = siblingData[field.name] as Record<string, unknown>;
        tabSiblingDoc = siblingDoc[field.name] as Record<string, unknown>;
        tabPreviousSiblingDoc = previousDoc[field.name] as Record<string, unknown>;
      }

      await traverseFields({
        data,
        doc,
        fields: field.fields,
        operation,
        req,
        previousSiblingDoc: tabPreviousSiblingDoc,
        previousDoc,
        siblingData: tabSiblingData,
        siblingDoc: tabSiblingDoc,
        context,
      });

      break;
    }

    case 'tabs': {
      await traverseFields({
        data,
        doc,
        previousDoc,
        previousSiblingDoc: { ...previousSiblingDoc },
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        operation,
        req,
        siblingData: siblingData || {},
        siblingDoc: { ...siblingDoc },
        context,
      });
      break;
    }

    default: {
      break;
    }
  }
};
