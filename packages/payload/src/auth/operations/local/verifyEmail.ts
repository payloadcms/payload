import type { Config as GeneratedTypes } from 'payload/generated-types';

import type { PayloadRequest } from '../../../express/types.js';
import type { Payload } from '../../../payload.js';

import { APIError } from '../../../errors/index.js';
import verifyEmail from '../verifyEmail.js';

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  token: string,
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
    collection,
    req,
    token,
  });
}

export default localVerifyEmail;
