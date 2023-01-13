/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection } from '../../config/types';
import update from '../../operations/update';
import { PayloadRequest } from '../../../express/types';
import { BaseConfig } from '../../../config/types';

export type Resolver<Config extends BaseConfig, Slug extends keyof BaseConfig['collections']> = (_: unknown, args: {
  id: string | number
  data: Config['collections'][Slug]
  locale?: string
  draft: boolean
  autosave: boolean
},
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Config['collections'][Slug]>

export default function updateResolver<Config extends BaseConfig, Slug extends keyof BaseConfig['collections']>(
  collection: Collection,
): Resolver<Config, Slug> {
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

    const result = await update<Config, Slug>(options);

    return result;
  }

  return resolver;
}
