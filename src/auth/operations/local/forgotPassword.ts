import { PayloadRequest } from '../../../express/types';
import { Result } from '../forgotPassword';

export type Options = {
  collection: string
  data: {
    email: string
  }
  expiration?: number
  disableEmail?: boolean
  req?: PayloadRequest
}

async function forgotPassword(options: Options): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    expiration,
    disableEmail,
    req,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.auth.forgotPassword({
    data,
    collection,
    overrideAccess: true,
    disableEmail,
    expiration,
    req: {
      ...req,
      payloadAPI: 'local',
      payload: this,
    },
  });
}

export default forgotPassword;
