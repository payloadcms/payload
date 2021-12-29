import { Collection } from '../collections/config/types';
import { Payload } from '..';
import { RichTextField } from './config/types';
import { PayloadRequest } from '../express/types';

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

const populate = async ({
  id,
  collection,
  data,
  overrideAccess,
  depth,
  currentDepth,
  payload,
  req,
  showHiddenFields,
}: Arguments & {
  id: string,
  collection: Collection
}) => {
  const dataRef = data as Record<string, unknown>;

  const newReq = { ...req, payloadAPI: 'local' } as PayloadRequest;

  const doc = await payload.findByID({
    req: newReq,
    collection: collection.config.slug,
    id,
    currentDepth: currentDepth + 1,
    overrideAccess,
    disableErrors: true,
    depth,
    showHiddenFields,
  });

  if (doc) {
    dataRef.value = doc;
  } else {
    dataRef.value = null;
  }
};

const recurseRichText = ({
  req,
  children,
  payload,
  overrideAccess = false,
  depth,
  currentDepth = 0,
  field,
  promises,
  showHiddenFields,
}: RecurseRichTextArgs) => {
  if (Array.isArray(children)) {
    (children as any[]).forEach((element) => {
      const collection = payload.collections[element?.relationTo];

      if ((element.type === 'relationship' || element.type === 'upload')
        && element?.value?.id
        && collection
        && (depth && currentDepth <= depth)) {
        promises.push(populate({
          req,
          id: element.value.id,
          data: element,
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
