import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';

export type Options<T> = {
  collection: string
  data: Record<string, unknown>
  depth?: number
  locale?: string
  fallbackLocale?: string
  user?: Document
  overrideAccess?: boolean
  disableVerificationEmail?: boolean
  showHiddenFields?: boolean
  filePath?: string
  overwriteExistingFiles?: boolean
  req: PayloadRequest
  draft?: boolean
}

export default async function create<T = any>(options: Options<T>): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    data,
    user,
    overrideAccess = true,
    disableVerificationEmail,
    showHiddenFields,
    filePath,
    overwriteExistingFiles = false,
    req,
    draft,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.create({
    depth,
    data,
    collection,
    overrideAccess,
    disableVerificationEmail,
    showHiddenFields,
    overwriteExistingFiles,
    draft,
    req: {
      ...req,
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
      files: {
        file: getFileByPath(filePath),
      },
    },
  });
}
