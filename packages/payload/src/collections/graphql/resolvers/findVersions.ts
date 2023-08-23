/* eslint-disable no-param-reassign */

import { Response } from 'express';
import { Where } from '../../../types';
import type { PaginatedDocs } from '../../../database/types';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
import findVersions from '../../operations/findVersions';

export type Resolver = (
  _: unknown,
  args: {
    locale?: string
    fallbackLocale?: string
    where: Where
    limit?: number
    page?: number
    sort?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<PaginatedDocs<any>>

export default function findVersionsResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      where: args.where,
      limit: args.limit,
      page: args.page,
      sort: args.sort,
      req: context.req,
      depth: 0,
    };

    const result = await findVersions(options);

    return result;
  }

  return resolver;
}
