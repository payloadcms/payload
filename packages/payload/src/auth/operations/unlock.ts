import { APIError } from '../../errors/index.js';
import executeAccess from '../executeAccess.js';
import { Collection } from '../../collections/config/types.js';
import { PayloadRequest } from '../../express/types.js';
import { resetLoginAttempts } from '../strategies/local/resetLoginAttempts.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';

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
      config: collectionConfig,
    },
    req,
    req: {
      payload,
      locale,
    },
    overrideAccess,
  } = args;

  try {
    const shouldCommit = await initTransaction(req);

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

    if (!data.email) {
      throw new APIError('Missing email.');
    }

    const user = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      where: { email: { equals: data.email.toLowerCase() } },
      locale,
      req,
    });

    let result;

    if (user) {
      await resetLoginAttempts({
        req,
        payload: req.payload,
        collection: collectionConfig,
        doc: user,
      });
      result = true;
    } else {
      result = null;
    }

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default unlock;
