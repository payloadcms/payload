/* eslint-disable no-param-reassign */
import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
import update from '../../operations/update';

export type Resolver = (_: unknown, args: {
  data: Record<string, unknown>,
  locale?: string
  id: string | number
  fallbackLocale?: string
  autosave?: boolean
  draft: boolean
},
context: {
  req: PayloadRequest,
  res: Response
}
) => Promise<Document>

export default function updateResolver(payload: Payload, collection: Collection): Resolver {
  return async function resolver(_, args, context) {
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
      payload,
    };

    const result = await update(options);

    return result;
  };
}
