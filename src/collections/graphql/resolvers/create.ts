/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';

export type Resolver = (_: unknown, args: {
    data: Record<string, unknown>,
    locale?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function create(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    if (args.locale) {
      context.req.locale = args.locale;
    }

    const options = {
      collection,
      data: args.data,
      req: context.req,
      draft: args.draft,
    };

    const result = await this.operations.collections.create(options);

    return result;
  }

  const createResolver = resolver.bind(this);
  return createResolver;
}
