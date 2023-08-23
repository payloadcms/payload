import { Config as SchemaConfig } from 'payload/generated-types';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
import findByID from '../../operations/findByID';

export type Resolver<T> = (_: unknown, args: {
  locale?: string
  draft: boolean
  id: string
  fallbackLocale?: string
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
      id: args.id,
      req,
      draft: args.draft,
      depth: 0,
    };

    const result = await findByID(options);

    return result;
  };
}
