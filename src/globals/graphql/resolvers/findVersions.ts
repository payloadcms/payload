import { Response } from 'express';
import { Document, Where } from '../../../types';
import { SanitizedGlobalConfig } from '../../config/types';
import { PayloadRequest } from '../../../express/types';

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

function findVersions(globalConfig: SanitizedGlobalConfig) {
  async function resolver(_, args, context) {
    const options = {
      globalConfig,
      where: args.where,
      limit: args.limit,
      page: args.page,
      sort: args.sort,
      req: context.req,
    };

    const result = await this.operations.globals.findVersions(options);

    return result;
  }

  const findVersionsResolver = resolver.bind(this);
  return findVersionsResolver;
}

export default findVersions;
