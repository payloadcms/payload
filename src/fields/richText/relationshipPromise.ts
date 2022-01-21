import { Payload } from '../..';
import { RichTextField } from '../config/types';
import { PayloadRequest } from '../../express/types';
import { recurseNestedFields } from './recurseNestedFields';
import { populate } from './populate';

type Arguments = {
  data: unknown
  overrideAccess?: boolean
  depth: number
  currentDepth?: number
  payload: Payload
  field: RichTextField
  req: PayloadRequest
  showHiddenFields: boolean
}

type RecurseRichTextArgs = {
  children: unknown[]
  overrideAccess: boolean
  depth: number
  currentDepth: number
  payload: Payload
  field: RichTextField
  req: PayloadRequest
  promises: Promise<void>[]
  showHiddenFields: boolean
}

export const recurseRichText = ({
  req,
  children,
  payload,
  overrideAccess = false,
  depth,
  currentDepth = 0,
  field,
  promises,
  showHiddenFields,
}: RecurseRichTextArgs): void => {
  if (Array.isArray(children)) {
    (children as any[]).forEach((element) => {
      const collection = payload.collections[element?.relationTo];

      if ((element.type === 'relationship' || element.type === 'upload')
        && element?.value?.id
        && collection
        && (depth && currentDepth <= depth)) {
        if (element.type === 'upload' && Array.isArray(field.admin?.upload?.collections?.[element?.relationTo]?.fields)) {
          recurseNestedFields({
            promises,
            data: element.fields || {},
            fields: field.admin.upload.collections[element.relationTo].fields,
            req,
            payload,
            overrideAccess,
            depth,
            currentDepth,
            showHiddenFields,
          });
        }
        promises.push(populate({
          req,
          id: element.value.id,
          data: element,
          key: 'value',
          overrideAccess,
          depth,
          currentDepth,
          payload,
          field,
          collection,
          showHiddenFields,
        }));
      }

      if (element?.children) {
        recurseRichText({
          req,
          children: element.children,
          payload,
          overrideAccess,
          depth,
          currentDepth,
          field,
          promises,
          showHiddenFields,
        });
      }
    });
  }
};

const richTextRelationshipPromise = ({
  req,
  data,
  payload,
  overrideAccess,
  depth,
  currentDepth,
  field,
  showHiddenFields,
}: Arguments) => async (): Promise<void> => {
  const promises = [];

  recurseRichText({
    req,
    children: data[field.name],
    payload,
    overrideAccess,
    depth,
    currentDepth,
    field,
    promises,
    showHiddenFields,
  });

  await Promise.all(promises);
};

export default richTextRelationshipPromise;
