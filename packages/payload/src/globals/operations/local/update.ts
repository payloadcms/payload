import type { Config as GeneratedTypes } from 'payload/generated-types';
import type { DeepPartial } from 'ts-essentials';

import type { PayloadRequest } from '../../../express/types.js';
import type { Payload } from '../../../payload.js';
import type { Document } from '../../../types/index.js';

import { getDataLoader } from '../../../collections/dataloader.js';
import { APIError } from '../../../errors/index.js';
import { setRequestContext } from '../../../express/setRequestContext.js';
import { i18nInit } from '../../../translations/init.js';
import update from '../update.js';

export type Options<TSlug extends keyof GeneratedTypes['globals']> = {
  data: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function updateLocal<TSlug extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const {
    data,
    depth,
    draft,
    fallbackLocale = null,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    overrideAccess = true,
    showHiddenFields,
    slug: globalSlug,
    user,
  } = options;

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);
  const i18n = i18nInit(payload.config.i18n as any);
  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`);
  }

  const req = {
    fallbackLocale,
    i18n,
    locale,
    payload,
    payloadAPI: 'local',
    t: i18n.t,
    user,
  } as PayloadRequest;
  setRequestContext(req);

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return update<TSlug>({
    data,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
    slug: globalSlug as string,
  });
}
