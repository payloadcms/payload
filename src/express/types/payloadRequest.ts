import { Request } from 'express';
import { Payload } from '../../index';


export type PayloadRequest = Request & {
  payload: Payload;
  locale?: string;
  // user: User
};
