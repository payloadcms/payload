import httpStatus from 'http-status';
import { APIError } from '../../errors.js';
import { Collection } from '../../collections/config/types.js';
import { PayloadRequest } from '../../express/types.js';

export type Args = {
  req: PayloadRequest,
  token: string
  collection: Collection
}

async function verifyEmail(args: Args): Promise<boolean> {
  const {
    req,
    token,
    collection,
  } = args;
  if (!Object.prototype.hasOwnProperty.call(args, 'token')) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST);
  }

  const user = await req.payload.db.findOne<any>({
    collection: collection.config.slug,
    where: {
      _verificationToken: { equals: token },
    },
  });

  if (!user) throw new APIError('Verification token is invalid.', httpStatus.BAD_REQUEST);
  if (user && user._verified === true) throw new APIError('This account has already been activated.', httpStatus.ACCEPTED);

  await req.payload.db.updateOne({
    collection: collection.config.slug,
    id: user.id,
    data: {
      _verified: true,
      _verificationToken: null,
    },
    req,
  });

  return true;
}

export default verifyEmail;
