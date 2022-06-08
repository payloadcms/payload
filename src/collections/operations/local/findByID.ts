import { TypeWithID } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';

export type Options = {
  collection: string
  id: string
  depth?: number
  currentDepth?: number
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  disableErrors?: boolean
  req?: PayloadRequest
  draft?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function findByID<T extends TypeWithID = any>(options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    currentDepth,
    id,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    disableErrors = false,
    showHiddenFields,
    req,
    draft = false,
  } = options;

  const locale = req.locale || this?.config?.localization?.defaultLocale;

  const collection = this.collections[collectionSlug];

  const reqToUse = {
    user: undefined,
    ...req || {},
    payloadAPI: 'local',
    locale,
    fallbackLocale,
    payload: this,
  };

  if (typeof user !== 'undefined') reqToUse.user = user;

  return this.operations.collections.findByID({
    depth,
    currentDepth,
    id,
    collection,
    overrideAccess,
    disableErrors,
    showHiddenFields,
    req: reqToUse,
    draft,
  });
}
