import { TypeWithID } from '../../config/types';
import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';

export type Options = {
  collection: string
  id: string | number
  data: Record<string, unknown>
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
  filePath?: string
  overwriteExistingFiles?: boolean
}

export default async function update<T extends TypeWithID = any>(options: Options): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    data,
    id,
    user,
    overrideAccess = true,
    showHiddenFields,
    filePath,
    overwriteExistingFiles = false,
  } = options;

  const collection = this.collections[collectionSlug];

  const args = {
    depth,
    data,
    collection,
    overrideAccess,
    id,
    showHiddenFields,
    overwriteExistingFiles,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
      file: getFileByPath(filePath),
    },
  };

  return this.operations.collections.update(args);
}
