/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection } from '../../config/types';
import { PayloadRequest } from '../../../express/types';

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

export default function publishVersion(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      id: args.id,
      req: context.req,
    };

    await this.operations.collections.publishVersion(options);
    return true;
  }

  const findVersionByIDResolver = resolver.bind(this);
  return findVersionByIDResolver;
}
