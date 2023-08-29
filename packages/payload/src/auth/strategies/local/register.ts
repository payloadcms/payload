import { ValidationError } from '../../../errors/index.js';
import { Payload } from '../../../index.js';
import { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import { generatePasswordSaltHash } from './generatePasswordSaltHash.js';
import { PayloadRequest } from '../../../express/types.js';

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

  const sanitizedDoc = { ...doc };
  if (sanitizedDoc.password) delete sanitizedDoc.password;

  return payload.db.create({
    collection: collection.slug,
    data: {
      ...sanitizedDoc,
      salt,
      hash,
    },
    req,
  });
};
