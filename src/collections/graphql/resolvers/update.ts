/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { Collection } from '../../config/types';
import updateByID from '../../operations/updateByID';
import { PayloadRequest } from '../../../express/types';

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (_: unknown, args: {
  id: string | number
  data: GeneratedTypes['collections'][TSlug]
  locale?: string
  draft: boolean
  autosave: boolean
},
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function updateResolver<TSlug extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<TSlug> {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      data: args.data,
      id: args.id,
      depth: 0,
      req: context.req,
      draft: args.draft,
      autosave: args.autosave,
    };

    const result = await updateByID<TSlug>(options);

    return result;
  }

  return resolver;
}
