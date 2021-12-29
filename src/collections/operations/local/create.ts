import { Document } from '../../../types';
import getFileByPath from '../../../uploads/getFileByPath';

export type Options = {
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
}
export default async function create(options: Options): Promise<Document> {
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
  });
}
