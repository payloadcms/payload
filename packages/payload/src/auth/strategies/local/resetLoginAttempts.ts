import type { Payload } from '../../..';
import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types';
import type { PayloadRequest } from '../../../express/types';

type Args = {
  collection: SanitizedCollectionConfig
  doc: TypeWithID & Record<string, unknown>
  payload: Payload
  req: PayloadRequest,
}

export const resetLoginAttempts = async ({
  collection,
  doc,
  payload,
  req,
}: Args): Promise<void> => {
  await payload.update({
    collection: collection.slug,
    data: {
      lockUntil: null,
      loginAttempts: 0,
    },
    id: doc.id,
    req,
  });
};
