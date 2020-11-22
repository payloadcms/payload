import { Request } from 'express';
import { Payload } from '../../index';
import { Collection } from '../../collections/config/types';

export type PayloadRequest = Request & {
  payload: Payload;
  locale?: string;
  collection?: Collection;
  file?: {
    name: string,
  }
  // user: User
};
