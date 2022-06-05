/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
import create from '../../operations/create';

export type Resolver = (_: unknown, args: {
    data: Record<string, unknown>,
    locale?: string
    draft: boolean
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function createResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context) {
    if (args.locale) {
      context.req.locale = args.locale;
    }

    const options = {
      collection,
      data: args.data,
      req: context.req,
      draft: args.draft,
    };

    const result = await create(options);

    return result;
  };
}
