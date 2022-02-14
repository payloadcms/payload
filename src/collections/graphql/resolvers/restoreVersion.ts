/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection } from '../../config/types';
import { PayloadRequest } from '../../../express/types';

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function restoreVersion(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    const options = {
      collection,
      id: args.id,
      req: context.req,
    };

    const result = await this.operations.collections.restoreVersion(options);
    return result;
  }

  const restoreVersionResolver = resolver.bind(this);
  return restoreVersionResolver;
}
