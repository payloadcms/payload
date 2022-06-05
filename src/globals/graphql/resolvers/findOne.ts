/* eslint-disable no-param-reassign */

import { SanitizedGlobalConfig } from '../../config/types';
import { Document } from '../../../types';
import findOne from '../../operations/findOne';

export default function findOneResolver(globalConfig: SanitizedGlobalConfig): Document {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const { slug } = globalConfig;

    const options = {
      globalConfig,
      slug,
      depth: 0,
      req: context.req,
      draft: args.draft,
    };

    const result = await findOne(options);
    return result;
  };
}
