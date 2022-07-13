/* eslint-disable no-param-reassign */
import { PayloadRequest } from '../../../express/types';
import { Field, fieldAffectsData, valueIsValueWithRelation } from '../../config/types';
import { traverseFields } from './traverseFields';

type Args = {
  data: Record<string, unknown>
  doc: Record<string, unknown>
  field: Field
  id?: string | number
  operation: 'create' | 'update'
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
  siblingData: Record<string, unknown>
  siblingDoc: Record<string, unknown>
}

// This function is responsible for the following actions, in order:
// - Sanitize incoming data
// - Execute field hooks
// - Execute field access control

export const promise = async ({
  data,
  doc,
  field,
  id,
  operation,
  overrideAccess,
  promises,
  req,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
  if (fieldAffectsData(field)) {
    if (field.name === 'id') {
      if (field.type === 'number' && typeof siblingData[field.name] === 'string') {
        const value = siblingData[field.name] as string;

        siblingData[field.name] = parseFloat(value);
      }

      if (field.type === 'text' && typeof siblingData[field.name]?.toString === 'function' && typeof siblingData[field.name] !== 'string') {
        siblingData[field.name] = siblingData[field.name].toString();
      }
    }

    // Sanitize incoming data
    switch (field.type) {
      case 'number': {
        if (typeof siblingData[field.name] === 'string') {
          const value = siblingData[field.name] as string;
          const trimmed = value.trim();
          siblingData[field.name] = (trimmed.length === 0) ? null : parseFloat(trimmed);
        }

        break;
      }

      case 'checkbox': {
        if (siblingData[field.name] === 'true') siblingData[field.name] = true;
        if (siblingData[field.name] === 'false') siblingData[field.name] = false;
        if (siblingData[field.name] === '') siblingData[field.name] = false;

        break;
      }

      case 'richText': {
        if (typeof siblingData[field.name] === 'string') {
          try {
            const richTextJSON = JSON.parse(siblingData[field.name] as string);
            siblingData[field.name] = richTextJSON;
          } catch {
            // Disregard this data as it is not valid.
            // Will be reported to user by field validation
          }
        }

        break;
      }

      case 'relationship':
      case 'upload': {
        if (siblingData[field.name] === '' || siblingData[field.name] === 'none' || siblingData[field.name] === 'null' || siblingData[field.name] === null) {
          if (field.type === 'relationship' && field.hasMany === true) {
            siblingData[field.name] = [];
          } else {
            siblingData[field.name] = null;
          }
        }

        const value = siblingData[field.name];

        if (Array.isArray(field.relationTo)) {
          if (Array.isArray(value)) {
            value.forEach((relatedDoc: { value: unknown, relationTo: string }, i) => {
              const relatedCollection = req.payload.config.collections.find((collection) => collection.slug === relatedDoc.relationTo);
              const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
              if (relationshipIDField?.type === 'number') {
                siblingData[field.name][i] = { ...relatedDoc, value: parseFloat(relatedDoc.value as string) };
              }
            });
          }
          if (field.type === 'relationship' && field.hasMany !== true && valueIsValueWithRelation(value)) {
            const relatedCollection = req.payload.config.collections.find((collection) => collection.slug === value.relationTo);
            const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
            if (relationshipIDField?.type === 'number') {
              siblingData[field.name] = { ...value, value: parseFloat(value.value as string) };
            }
          }
        } else {
          if (Array.isArray(value)) {
            value.forEach((relatedDoc: unknown, i) => {
              const relatedCollection = req.payload.config.collections.find((collection) => collection.slug === field.relationTo);
              const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
              if (relationshipIDField?.type === 'number') {
                siblingData[field.name][i] = parseFloat(relatedDoc as string);
              }
            });
          }
          if (field.type === 'relationship' && field.hasMany !== true && value) {
            const relatedCollection = req.payload.config.collections.find((collection) => collection.slug === field.relationTo);
            const relationshipIDField = relatedCollection.fields.find((collectionField) => fieldAffectsData(collectionField) && collectionField.name === 'id');
            if (relationshipIDField?.type === 'number') {
              siblingData[field.name] = parseFloat(value as string);
            }
          }
        }
        break;
      }

      case 'array':
      case 'blocks': {
        // Handle cases of arrays being intentionally set to 0
        if (siblingData[field.name] === '0' || siblingData[field.name] === 0 || siblingData[field.name] === null) {
          siblingData[field.name] = [];
        }

        break;
      }

      default: {
        break;
      }
    }

    // Execute hooks
    if (field.hooks?.beforeValidate) {
      await field.hooks.beforeValidate.reduce(async (priorHook, currentHook) => {
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

    // Execute access control
    if (field.access && field.access[operation]) {
      const result = overrideAccess ? true : await field.access[operation]({ req, id, siblingData, data, doc });

      if (!result) {
        delete siblingData[field.name];
      }
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'group': {
      let groupData = siblingData[field.name] as Record<string, unknown>;
      let groupDoc = siblingDoc[field.name] as Record<string, unknown>;

      if (typeof siblingData[field.name] !== 'object') groupData = {};
      if (typeof siblingDoc[field.name] !== 'object') groupDoc = {};

      traverseFields({
        data,
        doc,
        fields: field.fields,
        id,
        operation,
        overrideAccess,
        promises,
        req,
        siblingData: groupData,
        siblingDoc: groupDoc,
      });

      break;
    }

    case 'array': {
      const rows = siblingData[field.name];

      if (Array.isArray(rows)) {
        rows.forEach((row, i) => {
          traverseFields({
            data,
            doc,
            fields: field.fields,
            id,
            operation,
            overrideAccess,
            promises,
            req,
            siblingData: row,
            siblingDoc: siblingDoc[field.name]?.[i] || {},
          });
        });
      }
      break;
    }

    case 'blocks': {
      const rows = siblingData[field.name];

      if (Array.isArray(rows)) {
        rows.forEach((row, i) => {
          const block = field.blocks.find((blockType) => blockType.slug === row.blockType);

          if (block) {
            traverseFields({
              data,
              doc,
              fields: block.fields,
              id,
              operation,
              overrideAccess,
              promises,
              req,
              siblingData: row,
              siblingDoc: siblingDoc[field.name]?.[i] || {},
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
        id,
        operation,
        overrideAccess,
        promises,
        req,
        siblingData,
        siblingDoc,
      });

      break;
    }

    default: {
      break;
    }
  }
};
