import url from 'url';
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
    const parsedURL = url.parse(req.originalUrl);
    const isGraphQL = parsedURL.pathname === `/api${req.payload.config.routes.graphQL}`;

    const user = await req.payload.findByID({
      id: req.user.id,
      collection: collection.config.slug,
      req,
      depth: isGraphQL ? 0 : collection.config.auth.depth,
      overrideAccess: false,
      showHiddenFields: false,
    }) as User;

    if (req.user.collection !== collection.config.slug) {
      return {
        user: null,
      };
    }

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
      context: req.context,
    }) || response;
  }, Promise.resolve());

  return response;
}

export default me;
