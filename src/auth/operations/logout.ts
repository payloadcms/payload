import httpStatus from 'http-status';
import { Response } from 'express';
import { PayloadRequest } from '../../express/types';
import { APIError } from '../../errors';
import { Collection } from '../../collections/config/types';

export type Arguments = {
  req: PayloadRequest
  res: Response
  collection: Collection
}

async function logout(args: Arguments): Promise<string> {
  const { config } = this;

  const {
    res,
    collection: {
      config: collectionConfig,
    },
  } = args;

  if (!args.req.user) throw new APIError('No User', httpStatus.BAD_REQUEST);
  if (args.req.user.collection !== collectionConfig.slug) throw new APIError('Incorrect collection', httpStatus.FORBIDDEN);

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: collectionConfig.auth.cookies.secure,
    sameSite: collectionConfig.auth.cookies.sameSite,
  };

  res.clearCookie(`${config.cookiePrefix}-token`, cookieOptions);

  return 'Logged out successfully.';
}

export default logout;
