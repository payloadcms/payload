/* eslint-disable no-param-reassign */

import type { Document } from '../../../types/index.js';
import type { SanitizedGlobalConfig } from '../../config/types.js';

import findOne from '../../operations/findOne.js';

export default function findOneResolver(globalConfig: SanitizedGlobalConfig): Document {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const { slug } = globalConfig;

    const options = {
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: context.req,
      slug,
    };

    const result = await findOne(options);
    return result;
  };
}
