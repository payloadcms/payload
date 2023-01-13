import { APIError } from '../../../errors';
import { Payload } from '../../../index';
import verifyEmail from '../verifyEmail';

export type Options = {
  token: string,
  collection: string
}

async function localVerifyEmail(payload: Payload, options: Options): Promise<boolean> {
  const {
    collection: collectionSlug,
    token,
  } = options;

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${collectionSlug} can't be found.`);
  }

  return verifyEmail({
    token,
    collection,
  });
}

export default localVerifyEmail;
