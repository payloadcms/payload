import { Request } from 'express';
import { Payload } from '../../index';
import { Collection } from '../../collections/config/types';

export type PayloadRequest = Request & {
  payload: Payload;
  locale?: string;
  fallbackLocale?: string;
  collection?: Collection;
  payloadAPI: 'REST' | 'local'
  file?: {
    name: string,
  }
  // user: User
};
