import { UploadedFile } from 'express-fileupload';
import { Document } from '../../../types';

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
  file?: UploadedFile
}

export default async function create(options: Options): Promise<Document> {
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
    file,
  } = options;

  const collection = this.collections[collectionSlug];

  return this.operations.collections.create({
    depth,
    data,
    collection,
    overrideAccess,
    disableVerificationEmail,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
      file,
    },
  });
}
