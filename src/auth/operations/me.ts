import jwt from 'jsonwebtoken';
import { Collection } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
import getExtractJWT from '../getExtractJWT';
import { User } from '../types';

type MeResponse = {
  user?: User,
  collection?: Collection,
  token?: string,
  exp?: string,
}

async function me({ req }: { req: PayloadRequest }): Promise<MeResponse> {
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

    const response: MeResponse = {
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
