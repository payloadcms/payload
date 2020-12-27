/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';

export type Resolver = (
  _: unknown,
  args: {
    locale?: string
    fallbackLocale?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function getDeleteResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      id: args.id,
      req: context.req,
    };

    const result = await this.operations.collections.delete(options);

    return result;
  }

  const deleteResolver = resolver.bind(this);
  return deleteResolver;
}
