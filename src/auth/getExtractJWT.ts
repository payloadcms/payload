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
        const authCollections = config.collections.filter(collection => collection.auth.cookies.prefix); 
        for (const collection of authCollections) {
          const collectionCookieName = `${collection.auth.cookies.prefix}-token`;
          if (cookies[collectionCookieName]) {
              return cookies[collectionCookieName];
          }
        };
        const globalCookieName = `${config.cookiePrefix}-token`;
        if (cookies[globalCookieName]) {
          return cookies[globalCookieName];
        }
      }

    }

  }

  return null;
};

export default getExtractJWT;
