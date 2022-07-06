import { Payload } from '../../..';
import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';
import update from '../update';
import { PayloadRequest } from '../../../express/types';

export type Options<T> = {
  collection: string
  id: string | number
  data: Partial<T>
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  filePath?: string
  file?: File
  overwriteExistingFiles?: boolean
  draft?: boolean
  autosave?: boolean
}

export default async function updateLocal<T = any>(payload: Payload, options: Options<T>): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    fallbackLocale = null,
    data,
    id,
    user,
    overrideAccess = true,
    showHiddenFields,
    filePath,
    file,
    overwriteExistingFiles = false,
    draft,
    autosave,
  } = options;

  const collection = payload.collections[collectionSlug];

  const args = {
    depth,
    data,
    collection,
    overrideAccess,
    id,
    showHiddenFields,
    overwriteExistingFiles,
    draft,
    autosave,
    payload,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload,
      files: {
        file: file ?? getFileByPath(filePath),
      },
    } as PayloadRequest,
  };

  return update(args);
}
