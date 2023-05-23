/* eslint-disable no-param-reassign */
import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { PayloadRequest } from '../../../express/types';
import { SanitizedGlobalConfig } from '../../config/types';
import update from '../../operations/update';

type Resolver<TSlug extends keyof GeneratedTypes['globals']> = (
  _: unknown,
  args: {
    locale?: string
    fallbackLocale?: string
    data?: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
    draft?: boolean
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
      globalConfig,
      slug,
      depth: 0,
      data: args.data,
      req: context.req,
      draft: args.draft,
    };

    const result = await update<TSlug>(options);
    return result;
  };
}
