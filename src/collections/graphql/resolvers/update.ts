/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection } from '../../config/types';
import update from '../../operations/update';
import { PayloadRequest } from '../../../express/types';

export type Resolver = (_: unknown, args: {
    id: string | number
    data: Record<string, unknown>,
    locale?: string
    draft: boolean
    autosave: boolean
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function updateResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      data: args.data,
      id: args.id,
      depth: 0,
      req: context.req,
      draft: args.draft,
      autosave: args.autosave,
    };

    const result = await update(options);

    return result;
  }

  return resolver;
}
