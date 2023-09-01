import type { Config as SchemaConfig } from 'payload/generated-types';

import type { PayloadRequest } from '../../../express/types';
import type { Collection } from '../../config/types';

import findByID from '../../operations/findByID';

export type Resolver<T> = (_: unknown, args: {
  draft: boolean
  fallbackLocale?: string
  id: string
  locale?: string
},
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<T>

export default function findByIDResolver<T extends keyof SchemaConfig['collections']>(collection: Collection): Resolver<SchemaConfig['collections'][T]> {
  return async function resolver(_, args, context) {
    const { req } = context;
    if (args.locale) req.locale = args.locale;
    if (args.fallbackLocale) req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      depth: 0,
      draft: args.draft,
      id: args.id,
      req,
    };

    const result = await findByID(options);

    return result;
  };
}
