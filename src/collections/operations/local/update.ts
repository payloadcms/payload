import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';

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
  overwriteExistingFiles?: boolean
  draft?: boolean
  autosave?: boolean
}

export default async function update<T = any>(options: Options<T>): Promise<T> {
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
    draft,
    autosave,
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
    draft,
    autosave,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
      files: {
        file: getFileByPath(filePath),
      },
    },
  };

  return this.operations.collections.update(args);
}
