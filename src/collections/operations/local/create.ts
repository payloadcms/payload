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
  req?: PayloadRequest
  draft?: boolean
}

export default async function create<T = any>(options: Options<T>): Promise<T> {
  const {
    collection: collectionSlug,
    depth,
    locale,
    fallbackLocale,
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
      ...req || {},
      user,
      payloadAPI: 'local',
      locale: locale || req?.locale || this?.config?.localization?.defaultLocale,
      fallbackLocale: fallbackLocale || req?.fallbackLocale || null,
      payload: this,
      files: {
        file: getFileByPath(filePath),
      },
    },
  });
}
