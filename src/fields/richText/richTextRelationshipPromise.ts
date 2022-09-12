import { RichTextField } from '../config/types';
import { PayloadRequest } from '../../express/types';
import { recurseNestedFields } from './recurseNestedFields';
import { populate } from './populate';

type Args = {
  currentDepth?: number
  depth: number
  field: RichTextField
  overrideAccess?: boolean
  req: PayloadRequest
  siblingDoc: Record<string, unknown>
  showHiddenFields: boolean
}

type RecurseRichTextArgs = {
  children: unknown[]
  overrideAccess: boolean
  depth: number
  currentDepth: number
  field: RichTextField
  req: PayloadRequest
  promises: Promise<void>[]
  showHiddenFields: boolean
}

export const recurseRichText = ({
  req,
  children,
  overrideAccess = false,
  depth,
  currentDepth = 0,
  field,
  promises,
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
              req,
              id: element.value.id,
              data: element,
              key: 'value',
              overrideAccess,
              depth,
              currentDepth,
              field,
              collection,
              showHiddenFields,
            }));
          }

          if (element.type === 'upload' && Array.isArray(field.admin?.upload?.collections?.[element?.relationTo]?.fields)) {
            recurseNestedFields({
              promises,
              data: element.fields || {},
              fields: field.admin.upload.collections[element.relationTo].fields,
              req,
              overrideAccess,
              depth,
              currentDepth,
              showHiddenFields,
            });
          }
        }

        if (element.type === 'link') {
          if (element?.doc?.value && element?.doc?.relationTo) {
            const collection = req.payload.collections[element?.doc?.relationTo];

            if (collection) {
              promises.push(populate({
                req,
                id: element.doc.value,
                data: element.doc,
                key: 'value',
                overrideAccess,
                depth,
                currentDepth,
                field,
                collection,
                showHiddenFields,
              }));
            }
          }

          if (Array.isArray(field.admin?.link?.fields)) {
            recurseNestedFields({
              promises,
              data: element.fields || {},
              fields: field.admin?.link?.fields,
              req,
              overrideAccess,
              depth,
              currentDepth,
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
  siblingDoc,
  showHiddenFields,
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
