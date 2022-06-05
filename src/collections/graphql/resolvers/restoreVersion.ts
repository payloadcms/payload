/* eslint-disable no-param-reassign */
import { Response } from 'express';
import { Collection } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../..';
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

export default function restoreVersionResolver(payload: Payload, collection: Collection): Resolver {
  return async function resolver(_, args, context) {
    const options = {
      collection,
      id: args.id,
      req: context.req,
      payload,
    };

    const result = await restoreVersion(options);
    return result;
  };
}
