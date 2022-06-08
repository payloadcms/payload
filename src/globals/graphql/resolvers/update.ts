/* eslint-disable no-param-reassign */

import { PayloadRequest } from '../../../express/types';
import { SanitizedGlobalConfig } from '../../config/types';
import update from '../../operations/update';

type Resolver = (
  _: unknown,
  args: {
    locale?: string
    fallbackLocale?: string
    data?: Record<string, unknown>
    draft?: boolean
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function updateResolver(globalConfig: SanitizedGlobalConfig): Resolver {
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

    const result = await update(options);
    return result;
  };
}
