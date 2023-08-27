import { Config as GeneratedTypes } from 'payload/generated-types';
import { APIError } from '../../../errors.js';
import { Payload } from '../../../payload.js';
import verifyEmail from '../verifyEmail.js';
import { PayloadRequest } from '../../../express/types.js';

export type Options<T extends keyof GeneratedTypes['collections']> = {
  token: string,
  collection: T
}

async function localVerifyEmail<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<boolean> {
  const {
    collection: collectionSlug,
    token,
  } = options;

  const req = {
    payload,
  } as PayloadRequest;

  const collection = payload.collections[collectionSlug];

  if (!collection) {
    throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Verify Email Operation.`);
  }

  return verifyEmail({
    req,
    token,
    collection,
  });
}

export default localVerifyEmail;
