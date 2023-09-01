import type { PayloadRequest } from '../../express/types';
import type { RichTextField } from '../config/types';

import { populate } from './populate';
import { recurseNestedFields } from './recurseNestedFields';

type Args = {
  currentDepth?: number
  depth: number
  field: RichTextField
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}

type RecurseRichTextArgs = {
  children: unknown[]
  currentDepth: number
  depth: number
  field: RichTextField
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
}

export const recurseRichText = ({
  children,
  currentDepth = 0,
  depth,
  field,
  overrideAccess = false,
  promises,
  req,
  showHiddenFields,
}: RecurseRichTextArgs): void => {
  if (Array.isArray(children)) {
    (children as any[]).forEach((element) => {
      if ((depth && currentDepth <= depth)) {
        if ((element.type === 'relationship' || element.type === 'upload')
          && element?.value?.id) {
          const collection = req.payload.collections[element?.relationTo];

          if (collection) {
            promises.push(populate({
              collection,
              currentDepth,
              data: element,
              depth,
              field,
              id: element.value.id,
              key: 'value',
              overrideAccess,
              req,
              showHiddenFields,
            }));
          }

          if (element.type === 'upload' && Array.isArray(field.admin?.upload?.collections?.[element?.relationTo]?.fields)) {
            recurseNestedFields({
              currentDepth,
              data: element.fields || {},
              depth,
              fields: field.admin.upload.collections[element.relationTo].fields,
              overrideAccess,
              promises,
              req,
              showHiddenFields,
            });
          }
        }

        if (element.type === 'link') {
          if (element?.doc?.value && element?.doc?.relationTo) {
            const collection = req.payload.collections[element?.doc?.relationTo];

            if (collection) {
              promises.push(populate({
                collection,
                currentDepth,
                data: element.doc,
                depth,
                field,
                id: element.doc.value,
                key: 'value',
                overrideAccess,
                req,
                showHiddenFields,
              }));
            }
          }

          if (Array.isArray(field.admin?.link?.fields)) {
            recurseNestedFields({
              currentDepth,
              data: element.fields || {},
              depth,
              fields: field.admin?.link?.fields,
              overrideAccess,
              promises,
              req,
              showHiddenFields,
            });
          }
        }
      }

      if (element?.children) {
        recurseRichText({
          children: element.children,
          currentDepth,
          depth,
          field,
          overrideAccess,
          promises,
          req,
          showHiddenFields,
        });
      }
    });
  }
};

const richTextRelationshipPromise = async ({
  currentDepth,
  depth,
  field,
  overrideAccess,
  req,
  showHiddenFields,
  siblingDoc,
}: Args): Promise<void> => {
  const promises = [];

  recurseRichText({
    children: siblingDoc[field.name] as unknown[],
    currentDepth,
    depth,
    field,
    overrideAccess,
    promises,
    req,
    showHiddenFields,
  });

  await Promise.all(promises);
};

export default richTextRelationshipPromise;
