import { Request } from 'express';
import type { i18n as Ii18n, TFunction } from 'i18next';
import DataLoader from 'dataloader';
import { UploadedFile } from 'express-fileupload';
import { Payload } from '../payload';
import { Collection, TypeWithID } from '../collections/config/types';
import { User } from '../auth/types';
import { Document } from '../types';

/** Express request with some Payload related context added */
export declare type PayloadRequest<U = any> = Request & {
  /** The global payload object */
  payload: Payload;
  /** Optimized document loader */
  payloadDataLoader: DataLoader<string, TypeWithID>;
  /**
   * The requested locale if specified
   * Only available for localised collections
   */
  locale?: string;
  /** The locale that should be used for a field when it is not translated to the requested locale */
  fallbackLocale?: string;
  /** Information about the collection that is being accessed
   * - Configuration from payload-config.ts
   * - Mongo model for this collection
   * - GraphQL type metadata
   * */
  collection?: Collection;
  /** What triggered this request */
  payloadAPI?: 'REST' | 'local' | 'GraphQL';
  /** Uploaded files */
  files?: {
    /**
     * This is the file that Payload will use for the file upload, other files are ignored.
     *
     */
    file: UploadedFile;
  };
  /** I18next instance */
  i18n: Ii18n;
  /** Get a translation for the admin screen */
  t: TFunction;
  /** The signed in user */
  user: (U & User) | null;
  /** Resized versions of the image that was uploaded during this request */
  payloadUploadSizes?: Record<string, Buffer>;
  /** Cache of documents related to the current request */
  findByID?: {
    [slug: string]: (q: unknown) => Document;
  };
};
