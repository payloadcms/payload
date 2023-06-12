import mongoose from 'mongoose';
import type { Payload } from '../..';

import type { MongooseAdapter } from '.';
import { PaginatedDocs } from '../types';
import { QueryDraftsArgs } from '../../database/types';

export async function queryDrafts<T = any>(
  this: MongooseAdapter,
  { payload, collection, where, page, limit, sort, locale }: QueryDraftsArgs,
): Promise<PaginatedDocs<T>> {

}
