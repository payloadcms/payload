import { Payload } from '../../..';
import { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types';
import { PayloadRequest } from '../../../express/types';

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
