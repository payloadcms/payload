import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload.js';
import { getDataLoader } from '../../../collections/dataloader.js';
import { PayloadRequest } from '../../../express/types.js';
import { Document } from '../../../types.js';
import findOne from '../findOne.js';
import { i18nInit } from '../../../translations/init.js';
import { APIError } from '../../../errors.js';
import { setRequestContext } from '../../../express/setRequestContext.js';

export type Options<T extends keyof GeneratedTypes['globals']> = {
  slug: T
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  draft?: boolean
  req?: PayloadRequest
}

export default async function findOneLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['globals'][T]> {
  const {
    slug: globalSlug,
    depth,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    draft = false,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);
  const defaultLocale = payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null;

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`);
  }

  const i18n = i18nInit(payload.config.i18n);


  const req = {
    user,
    payloadAPI: 'local',
    locale: locale ?? options.req?.locale ?? defaultLocale,
    fallbackLocale: fallbackLocale ?? options.req?.fallbackLocale ?? defaultLocale,
    payload,
    i18n,
    t: i18n.t,
  } as PayloadRequest;
  setRequestContext(req);

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return findOne({
    slug: globalSlug as string,
    depth,
    globalConfig,
    overrideAccess,
    showHiddenFields,
    draft,
    req,
  });
}
