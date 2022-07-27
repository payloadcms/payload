import { TypeWithID } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import findByID from '../findByID';
import { Payload } from '../../..';
import { getDataLoader } from '../../dataloader';

export type Options = {
  collection: string
  id: string
  depth?: number
  currentDepth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  disableErrors?: boolean
  req?: PayloadRequest
  draft?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function findByIDLocal<T extends TypeWithID = any>(payload: Payload, options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    currentDepth,
    id,
    locale,
    fallbackLocale,
    user,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req: incomingReq,
    draft = false,
  } = options;

  const collection = payload.collections[collectionSlug];

  const req = {
    user: undefined,
    ...incomingReq || {},
    payloadAPI: 'local',
    locale: locale || incomingReq?.locale || (payload?.config?.localization ? payload?.config?.localization?.defaultLocale : null),
    fallbackLocale: fallbackLocale || incomingReq?.fallbackLocale || null,
    payload,
  } as PayloadRequest;

  if (typeof user !== 'undefined') req.user = user;

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req);

  return findByID({
    depth,
    currentDepth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req,
    draft,
  });
}
