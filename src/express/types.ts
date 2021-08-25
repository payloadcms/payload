import { Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import { Payload } from '../index';
import { Collection } from '../collections/config/types';
import { User } from '../auth/types';
import { Document } from '../types';

export type PayloadRequest = Request & {
  payload: Payload;
  locale?: string;
  fallbackLocale?: string;
  collection?: Collection;
  payloadAPI: 'REST' | 'local' | 'graphQL'
  file?: UploadedFile
  user: User | null
  payloadUploadSizes?: Record<string, Buffer>
  findByID?: {
    [slug: string]: (q: unknown) => Document
  }
};
