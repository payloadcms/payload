/* eslint-disable no-param-reassign */
import { Config as GeneratedTypes } from 'payload/generated-types';
import { Response } from 'express';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
import deleteByID from '../../operations/deleteByID';

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (
  _: unknown,
  args: {
    locale?: string
    fallbackLocale?: string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function getDeleteResolver<TSlug extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<TSlug> {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      id: args.id,
      req: context.req,
      depth: 0,
    };

    const result = await deleteByID(options);

    return result;
  }

  return resolver;
}
