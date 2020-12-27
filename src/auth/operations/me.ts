import jwt from 'jsonwebtoken';
import { PayloadRequest } from '../../express/types';
import getExtractJWT from '../getExtractJWT';
import { User } from '../types';

export type Result = {
  user?: User,
  collection?: string,
  token?: string,
  exp?: string,
}

export type Arguments = {
  req: PayloadRequest
}

async function me({ req }: Arguments): Promise<Result> {
  const extractJWT = getExtractJWT(this.config);

  if (req.user) {
    const requestedSlug = req.route.path.split('/').filter((r) => r !== '')[0];
    const user = { ...req.user };

    if (user.collection !== requestedSlug) {
      return {
        user: null,
      };
    }

    delete user.collection;

    const response: Result = {
      user,
      collection: req.user.collection,
    };

    const token = extractJWT(req);

    if (token) {
      response.token = token;
      const decoded = jwt.decode(token) as { exp: string };
      if (decoded) response.exp = decoded.exp;
    }

    return response;
  }

  return {
    user: null,
  };
}

export default me;
