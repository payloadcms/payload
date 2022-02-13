/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { SanitizedGlobalConfig } from '../../config/types';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';

export type Resolver = (
  _: unknown,
  args: {
    locale?: string
    fallbackLocale?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

function findVersionByID(globalConfig: SanitizedGlobalConfig): Resolver {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      id: args.id,
      globalConfig,
      req: context.req,
      draft: args.draft,
      depth: 0,
    };

    const result = await this.operations.globals.findVersionByID(options);
    return result;
  }

  const findOneResolver = resolver.bind(this);
  return findOneResolver;
}

export default findVersionByID;
