import jwt from 'jsonwebtoken';
import { PayloadRequest } from '../../express/types';
import getExtractJWT from '../getExtractJWT';
import { User } from '../types';
import { Collection } from '../../collections/config/types';

export type Result = {
  user?: User,
  collection?: string,
  token?: string,
  exp?: number,
}

export type Arguments = {
  req: PayloadRequest
  collection: Collection
}

async function me({
  req,
  collection,
}: Arguments): Promise<Result> {
  const extractJWT = getExtractJWT(req.payload.config);
  let response: Result = {
    user: null,
  };

  if (req.user) {
    const user = { ...req.user };

    if (user.collection !== collection.config.slug) {
      return {
        user: null,
      };
    }

    delete user.collection;

    response = {
      user,
      collection: req.user.collection,
    };

    const token = extractJWT(req);

    if (token) {
      response.token = token;
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (decoded) response.exp = decoded.exp;
    }
  }

  // /////////////////////////////////////
  // After Me - Collection
  // /////////////////////////////////////

  await collection.config.hooks.afterMe.reduce(async (priorHook, hook) => {
    await priorHook;

    response = await hook({
      req,
      response,
    }) || response;
  }, Promise.resolve());

  return response;
}

export default me;
