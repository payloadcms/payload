/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
import restoreVersion from '../../operations/restoreVersion';

export type Resolver = (
  _: unknown,
  args: {
    id: string | number
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>

export default function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    const options = {
      collection,
      id: args.id,
      req: context.req,
      depth: 0,
    };

    const result = await restoreVersion(options);
    return result;
  }

  return resolver;
}
