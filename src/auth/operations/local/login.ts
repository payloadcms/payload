import { Response } from 'express';
import { Result } from '../login';
import { PayloadRequest } from '../../../express/types';
import { TypeWithID } from '../../../collections/config/types';

export type Options = {
  collection: string
  data: {
    email: string
    password: string
  }
  req?: PayloadRequest
  res?: Response
  depth?: number
  locale?: string
  fallbackLocale?: string
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function login<T extends TypeWithID = any>(options: Options): Promise<Result & { user: T}> {
  const {
    collection: collectionSlug,
    req = {},
    res,
    depth,
    locale,
    fallbackLocale,
    data,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const collection = this.collections[collectionSlug];

  const args = {
    depth,
    collection,
    overrideAccess,
    showHiddenFields,
    data,
    req: {
      ...req,
      payloadAPI: 'local',
      payload: this,
      locale: undefined,
      fallbackLocale: undefined,
    },
    res,
  };

  if (locale) args.req.locale = locale;
  if (fallbackLocale) args.req.fallbackLocale = fallbackLocale;

  return this.operations.collections.auth.login(args);
}

export default login;
