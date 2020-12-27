import { Request } from 'express';
import { Config } from '../config/types';
import parseCookies from '../utilities/parseCookies';

const getExtractJWT = (config: Config) => (req: Request): string | null => {
  if (req && req.get) {
    const jwtFromHeader = req.get('Authorization');
    const origin = req.get('Origin');

    if (jwtFromHeader && jwtFromHeader.indexOf('JWT ') === 0) {
      return jwtFromHeader.replace('JWT ', '');
    }

    const cookies = parseCookies(req);
    const tokenCookieName = `${config.cookiePrefix}-token`;

    if (cookies && cookies[tokenCookieName]) {
      if (!origin || (config.csrf && config.csrf.indexOf(origin) > -1)) {
        return cookies[tokenCookieName];
      }
    }
  }

  return null;
};

export default getExtractJWT;
