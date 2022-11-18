import { Request } from 'express';
import type { i18n as Ii18n, TFunction } from 'i18next';
import DataLoader from 'dataloader';
import { UploadedFile } from 'express-fileupload';
import { Payload } from '../index';
import { Collection } from '../collections/config/types';
import { User } from '../auth/types';
import { Document } from '../types';
import { TypeWithID } from '../globals/config/types';

export declare type PayloadRequest<T = any> = Request & {
  payload: Payload;
  payloadDataLoader: DataLoader<string, TypeWithID>;
  locale?: string;
  fallbackLocale?: string;
  collection?: Collection;
  payloadAPI: 'REST' | 'local' | 'graphQL';
  files?: {
    file: UploadedFile;
  };
  i18n: Ii18n;
  t: TFunction;
  user: T & User | null;
  payloadUploadSizes?: Record<string, Buffer>;
  findByID?: {
    [slug: string]: (q: unknown) => Document;
  };
};
