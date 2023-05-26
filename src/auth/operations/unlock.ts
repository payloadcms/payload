import { APIError } from '../../errors';
import executeAccess from '../executeAccess';
import { Collection } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
import { resetLoginAttempts } from '../strategies/local/resetLoginAttempts';

export type Args = {
  collection: Collection
  data: {
    email: string
  }
  req: PayloadRequest
  overrideAccess?: boolean
}

async function unlock(args: Args): Promise<boolean> {
  if (!Object.prototype.hasOwnProperty.call(args.data, 'email')) {
    throw new APIError('Missing email.');
  }

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    overrideAccess,
  } = args;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, collectionConfig.access.unlock);
  }

  const options = { ...args };

  const { data } = options;

  // /////////////////////////////////////
  // Unlock
  // /////////////////////////////////////

  const user = await Model.findOne({ email: data.email.toLowerCase() });

  if (!user) return null;

  await resetLoginAttempts({
    payload: req.payload,
    collection: collectionConfig,
    doc: user,
  });

  return true;
}

export default unlock;
