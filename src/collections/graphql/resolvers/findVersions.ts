/* eslint-disable no-param-reassign */

import { Response } from 'express';
import { Where } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';

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
) => Promise<Document>

export default function findVersions(collection: Collection): Resolver {
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
    };

    const result = await this.operations.collections.findVersions(options);

    return result;
  }

  const findVersionsResolver = resolver.bind(this);
  return findVersionsResolver;
}
