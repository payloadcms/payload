/* eslint-disable no-param-reassign */

import { Response } from 'express';
import { Where } from '../../../types/index.js';
import type { PaginatedDocs } from '../../../database/types.js';
import { PayloadRequest } from '../../../express/types.js';
import { Collection } from '../../config/types.js';
import findVersions from '../../operations/findVersions.js';

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
