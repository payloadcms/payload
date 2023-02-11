/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { MarkOptional } from 'ts-essentials';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
import create from '../../operations/create';

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (_: unknown, args: {
  data: Omit<MarkOptional<GeneratedTypes['collections'][TSlug], 'id' | 'updatedAt' | 'createdAt'>, 'sizes'>,
  locale?: string
  draft: boolean
},
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function createResolver<TSlug extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context) {
    if (args.locale) {
      context.req.locale = args.locale;
    }

    const options = {
      collection,
      data: args.data,
      req: context.req,
      draft: args.draft,
      depth: 0,
    };

    const result = await create(options);

    return result;
  };
}
