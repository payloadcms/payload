/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../config/types';
import { APIError } from '../../errors';
import { TypeWithRevision } from '../../revisions/types';
import { Payload } from '../../index';

export type Arguments = {
  collection: Collection
  id: string
  req: PayloadRequest
  disableErrors?: boolean
  currentDepth?: number
  overrideAccess?: boolean
  showHiddenFields?: boolean
  depth?: number
}

async function restoreRevision<T extends TypeWithRevision<T> = any>(this: Payload, args: Arguments): Promise<T> {
  const {
    collection,
    id,
    // overrideAccess = false,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of revision to restore.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // Retrieve revision
  // /////////////////////////////////////

  const revision = await this.findRevisionByID({
    ...args,
    collection: collection.config.slug,
  });

  const result = await this.update({
    ...args,
    id: revision.parent,
    collection: collection.config.slug,
    data: revision.revision,
    locale: args.req.locale,
  });

  return result;
}

export default restoreRevision;
