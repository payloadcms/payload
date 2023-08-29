/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection, TypeWithID } from '../../config/types.js';
import { PayloadRequest } from '../../../express/types.js';
import findVersionByID from '../../operations/findVersionByID.js';
import type { TypeWithVersion } from '../../../versions/types.js';

export type Resolver<T extends TypeWithID = any> = (
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
) => Promise<TypeWithVersion<T>>

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
