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

async function logout(incomingArgs: Arguments): Promise<string> {
  let args = incomingArgs;
  const {
    res,
    req: {
      payload: {
        config,
      },
      user,
    },
    req,
    collection: {
      config: collectionConfig,
    },
    collection,
  } = incomingArgs;

  if (!user) throw new APIError('No User', httpStatus.BAD_REQUEST);
  if (user.collection !== collectionConfig.slug) throw new APIError('Incorrect collection', httpStatus.FORBIDDEN);

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: collectionConfig.auth.cookies.secure,
    sameSite: collectionConfig.auth.cookies.sameSite,
    domain: undefined,
  };

  if (collectionConfig.auth.cookies.domain) cookieOptions.domain = collectionConfig.auth.cookies.domain;

  await collection.config.hooks.afterLogout.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      req,
      res,
    })) || args;
  }, Promise.resolve());

  res.clearCookie(`${config.cookiePrefix}-token`, cookieOptions);

  return req.t('authentication:loggedOutSuccessfully');
}

export default logout;
