import { UserDocument } from '..';
import { APIError } from '../../errors';
import executeAccess from '../executeAccess';
import { Collection } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';

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
    req: {
      session,
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

  let user: UserDocument;
  if (session) {
    user = await Model.findOne({ email: data.email.toLowerCase() }).session(session);
  } else {
    user = await Model.findOne({ email: data.email.toLowerCase() });
  }

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await user.resetLoginAttempts();

  return true;
}

export default unlock;
