import { ClientSession } from 'mongoose';
import { Payload } from '../../../index';
import verifyEmail from '../verifyEmail';

export type Options = {
  token: string,
  collection: string
  session?: ClientSession,
}

async function localVerifyEmail(payload: Payload, options: Options): Promise<boolean> {
  const {
    collection: collectionSlug,
    token,
    session,
  } = options;

  const collection = payload.collections[collectionSlug];

  return verifyEmail({
    token,
    collection,
    session,
  });
}

export default localVerifyEmail;
