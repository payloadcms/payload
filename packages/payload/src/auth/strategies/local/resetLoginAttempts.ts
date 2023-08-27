import { Payload } from '../../../index.js';
import { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types.js';
import { PayloadRequest } from '../../../express/types.js';

type Args = {
  req: PayloadRequest,
  payload: Payload
  doc: TypeWithID & Record<string, unknown>
  collection: SanitizedCollectionConfig
}

export const resetLoginAttempts = async ({
  req,
  payload,
  doc,
  collection,
}: Args): Promise<void> => {
  await payload.update({
    req,
    collection: collection.slug,
    id: doc.id,
    data: {
      loginAttempts: 0,
      lockUntil: null,
    },
  });
};
