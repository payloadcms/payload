/* eslint-disable react/destructuring-assignment */
import { Request } from 'express';
import { SanitizedConfig } from '../config/types';
import parseCookies from '../utilities/parseCookies';

const getExtractJWT = (config: SanitizedConfig) => (req: Request): string | null => {
  if (req && req.get) {
    const jwtFromHeader = req.get('Authorization');
    const origin = req.get('Origin');

    if (jwtFromHeader && jwtFromHeader.indexOf('JWT ') === 0) {
      return jwtFromHeader.replace('JWT ', '');
    }

    if (!origin || config.csrf.length === 0 || config.csrf.indexOf(origin) > -1) {
      const cookies = parseCookies(req);
      if (cookies) {
        const collectionPrefixes = config.collections.filter((collection) => collection.auth.cookies.prefix).map((collection) => collection.auth.cookies.prefix);
        const prefixes = [...collectionPrefixes, config.cookiePrefix];
        const foundPrefix = prefixes.find((prefix) => cookies[`${prefix}-token`]);

        if (foundPrefix) {
          return cookies[`${foundPrefix}-token`];
        }
      }
    }
  }

  return null;
};

export default getExtractJWT;
