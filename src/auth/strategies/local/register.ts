import { ValidationError } from '../../../errors';
import { Payload } from '../../..';
import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { generatePasswordSaltHash } from './generatePasswordSaltHash';
import { PayloadRequest } from '../../../express/types';

type Args = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  password: string
  payload: Payload
  req: PayloadRequest
}

export const registerLocalStrategy = async ({
  collection,
  doc,
  password,
  payload,
  req,
}: Args): Promise<Record<string, unknown>> => {
  const existingUser = await payload.find({
    collection: collection.slug,
    depth: 0,
    where: {
      email: {
        equals: doc.email,
      },
    },
  });

  if (existingUser.docs.length > 0) {
    throw new ValidationError([{ message: 'A user with the given email is already registered', field: 'email' }]);
  }

  const { salt, hash } = await generatePasswordSaltHash({ password });

  return payload.db.create({
    collection: collection.slug,
    data: {
      ...doc,
      salt,
      hash,
    },
    req,
  });
};
