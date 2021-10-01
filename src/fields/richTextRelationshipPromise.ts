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
}: Arguments & {
  id: string,
  collection: Collection
}) => {
  const dataRef = data as Record<string, unknown>;

  const doc = await payload.operations.collections.findByID({
    req: {
      ...req,
      payloadAPI: 'local',
    },
    collection,
    id,
    currentDepth: currentDepth + 1,
    overrideAccess,
    disableErrors: true,
    depth,
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
}: RecurseRichTextArgs) => {
  if (Array.isArray(children)) {
    (children as any[]).forEach((element) => {
      const collection = payload.collections[element?.relationTo];

      if (element.type === 'relationship'
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
  });

  await Promise.all(promises);
};

export default richTextRelationshipPromise;
