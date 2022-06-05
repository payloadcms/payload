/* eslint-disable no-param-reassign */

import { Response } from 'express';
import { Where } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
import { Payload } from '../../..';
import findVersions from '../../operations/findVersions';
import { PaginatedDocs } from '../../../mongoose/types';

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

export default function findVersionsResolver(payload: Payload, collection: Collection): Resolver {
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
      payload,
    };

    const result = await findVersions(options);

    return result;
  };
}
