/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { SanitizedGlobalConfig } from '../../config/types.js';
import { Document } from '../../../types/index.js';
import { PayloadRequest } from '../../../express/types.js';
import findVersionByID from '../../operations/findVersionByID.js';

export type Resolver = (
  _: unknown,
  args: {
    id: string | number
    locale?: string
    draft?: boolean
    fallbackLocale?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function findVersionByIDResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      id: args.id,
      globalConfig,
      req: context.req,
      draft: args.draft,
      depth: 0,
    };

    const result = await findVersionByID(options);
    return result;
  };
}
