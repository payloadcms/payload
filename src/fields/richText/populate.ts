/* eslint-disable @typescript-eslint/no-use-before-define */
import { Collection } from '../../collections/config/types';
import { Payload } from '../..';
import { RichTextField, Field } from '../config/types';
import { PayloadRequest } from '../../express/types';

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

export const populate = async ({
  id,
  collection,
  data,
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
  let dataRef = data as Record<string, unknown>;

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
    showHiddenFields,
  });

  if (doc) {
    dataRef = doc;
  } else {
    dataRef = null;
  }
};
