/* eslint-disable @typescript-eslint/no-use-before-define */
import { Collection } from '../../collections/config/types';
import { Payload } from '../..';
import { RichTextField, Field } from '../config/types';
import { PayloadRequest } from '../../express/types';

type Arguments = {
  data: unknown
  overrideAccess?: boolean
  key: string | number
  depth: number
  currentDepth?: number
  payload: Payload
  field: RichTextField
  req: PayloadRequest
  showHiddenFields: boolean
}

export const populate = async ({
  id,
  collection,
  data,
  key,
  overrideAccess,
  depth,
  currentDepth,
  payload,
  req,
  showHiddenFields,
}: Omit<Arguments, 'field'> & {
  id: string,
  field: Field
  collection: Collection
}): Promise<void> => {
  const dataRef = data as Record<string, unknown>;

  const doc = await payload.findByID({
    req,
    collection: collection.config.slug,
    id,
    currentDepth: currentDepth + 1,
    overrideAccess: typeof overrideAccess === 'undefined' ? false : overrideAccess,
    disableErrors: true,
    depth,
    showHiddenFields,
  });

  if (doc) {
    dataRef[key] = doc;
  } else {
    dataRef[key] = null;
  }
};
