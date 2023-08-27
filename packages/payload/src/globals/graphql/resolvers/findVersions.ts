import { Response } from 'express';
import { Document, Where } from '../../../types/index.js';
import { SanitizedGlobalConfig } from '../../config/types.js';
import { PayloadRequest } from '../../../express/types.js';
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
) => Promise<Document>

export default function findVersionsResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    const options = {
      globalConfig,
      where: args.where,
      limit: args.limit,
      page: args.page,
      sort: args.sort,
      req: context.req,
      depth: 0,
    };

    const result = await findVersions(options);

    return result;
  };
}
