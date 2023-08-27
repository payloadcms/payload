import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Payload } from '../../../payload.js';
import { Document } from '../../../types/index.js';
import { PayloadRequest } from '../../../express/types.js';
import update from '../update.js';
import { getDataLoader } from '../../../collections/dataloader.js';
import { i18nInit } from '../../../translations/init.js';
import { APIError } from '../../../errors/index.js';
import { setRequestContext } from '../../../express/setRequestContext.js';

export type Options<TSlug extends keyof GeneratedTypes['globals']> = {
  slug: TSlug
  depth?: number
  locale?: string
  fallbackLocale?: string
  data: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  draft?: boolean
}

export default async function updateLocal<TSlug extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const {
    slug: globalSlug,
    depth,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    data,
    user,
    overrideAccess = true,
    showHiddenFields,
    draft,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);
  const i18n = i18nInit(payload.config.i18n);

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`);
  }

  const req = {
    user,
    payloadAPI: 'local',
    locale,
    fallbackLocale,
    payload,
    i18n,
    t: i18n.t,
  } as PayloadRequest;
  setRequestContext(req);

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return update<TSlug>({
    slug: globalSlug as string,
    data,
    depth,
    globalConfig,
    overrideAccess,
    showHiddenFields,
    draft,
    req,
  });
}
