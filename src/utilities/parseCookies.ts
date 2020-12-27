import { Request } from 'express';

export default function parseCookies(req: Request): { [key: string]: string } {
  const list = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }

  return list;
}
