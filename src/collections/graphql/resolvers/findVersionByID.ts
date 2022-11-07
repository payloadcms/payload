/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
import findVersionByID from '../../operations/findVersionByID';

export type Resolver = (
  _: unknown,
  args: {
    locale?: string
    fallbackLocale?: string
    draft: boolean
    id: number | string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function findVersionByIDResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      id: args.id,
      req: context.req,
      draft: args.draft,
      depth: 0,
    };

    const result = await findVersionByID(options);

    return result;
  };
}
