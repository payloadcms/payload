/* eslint-disable no-param-reassign */
import { PayloadRequest } from '../../../express/types';
import type { PaginatedDocs } from '../../../database/types';
import { Where } from '../../../types';
import { Collection } from '../../config/types';
import find from '../../operations/find';

export type Resolver = (_: unknown,
  args: {
    data: Record<string, unknown>,
    locale?: string
    draft: boolean
    where?: Where
    limit?: number,
    page?: number,
    sort?: string
    fallbackLocale?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<PaginatedDocs<any>>

export default function findResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      where: args.where,
      limit: args.limit,
      page: args.page,
      sort: args.sort,
      req: context.req,
      draft: args.draft,
      depth: 0,
    };

    const results = await find(options);
    return results;
  };
}
