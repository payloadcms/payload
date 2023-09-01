/* eslint-disable no-param-reassign */
import type { Config as GeneratedTypes } from 'payload/generated-types';
import type { DeepPartial } from 'ts-essentials';

import type { PayloadRequest } from '../../../express/types';
import type { SanitizedGlobalConfig } from '../../config/types';

import update from '../../operations/update';

type Resolver<TSlug extends keyof GeneratedTypes['globals']> = (
  _: unknown,
  args: {
    data?: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
    draft?: boolean
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<GeneratedTypes['globals'][TSlug]>

export default function updateResolver<TSlug extends keyof GeneratedTypes['globals']>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const { slug } = globalConfig;

    const options = {
      data: args.data,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: context.req,
      slug,
    };

    const result = await update<TSlug>(options);
    return result;
  };
}
