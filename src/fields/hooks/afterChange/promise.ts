/* eslint-disable no-param-reassign */
import { PayloadRequest } from '../../../express/types';
import { Field, fieldAffectsData } from '../../config/types';
import { traverseFields } from './traverseFields';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  field: Field
  operation: 'create' | 'update'
  promises: Promise<void>[]
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
}

// This function is responsible for the following actions, in order:
// - Execute field hooks

export const promise = async ({
  data,
  doc,
  field,
  operation,
  promises,
  req,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
  if (fieldAffectsData(field)) {
    // Execute hooks
    if (field.hooks?.afterChange) {
      await field.hooks.afterChange.reduce(async (priorHook, currentHook) => {
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
          siblingDoc[field.name] = hookedValue;
        }
      }, Promise.resolve());
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'group': {
      traverseFields({
        data,
        doc,
        fields: field.fields,
        operation,
        promises,
        req,
        siblingData: siblingData[field.name] as Record<string, unknown> || {},
        siblingDoc: siblingDoc[field.name] as Record<string, unknown>,
      });

      break;
    }

    case 'array': {
      const rows = siblingDoc[field.name];

      if (Array.isArray(rows)) {
        rows.forEach((row, i) => {
          traverseFields({
            data,
            doc,
            fields: field.fields,
            operation,
            promises,
            req,
            siblingData: siblingData[field.name]?.[i] || {},
            siblingDoc: { ...row } || {},
          });
        });
      }
      break;
    }

    case 'blocks': {
      const rows = siblingDoc[field.name];

      if (Array.isArray(rows)) {
        rows.forEach((row, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === row.blockType);

          if (block) {
            traverseFields({
              data,
              doc,
              fields: block.fields,
              operation,
              promises,
              req,
              siblingData: siblingData[field.name]?.[i] || {},
              siblingDoc: { ...row } || {},
            });
          }
        });
      }

      break;
    }

    case 'row':
    case 'collapsible': {
      traverseFields({
        data,
        doc,
        fields: field.fields,
        operation,
        promises,
        req,
        siblingData: siblingData || {},
        siblingDoc: { ...siblingDoc },
      });

      break;
    }

    default: {
      break;
    }
  }
};
