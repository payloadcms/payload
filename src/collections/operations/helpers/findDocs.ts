import { PaginatedDocs } from '../../../mongoose/types';
import { CollectionModel } from '../../config/types';
import { Arguments } from '../find';

type FindDocsArguments = ({
  page: Arguments['page']
  limit: Arguments['limit']
  sort: {
    [key: string]: string,
  }
}) & ({
  pagination?: false
} | {
  pagination: true
  lean?: boolean
  leanWithId?: boolean
  useEstimatedCount?: boolean
  useCustomCountFn?: (() => Promise<number>) | undefined;
})

export async function findDocs<T>(Model: CollectionModel, query: Record<string, unknown>, args: FindDocsArguments): Promise<PaginatedDocs<T>> {
  // /////////////////////////////////////
  // Model.paginate ignores limit when paginate is true
  // pass limit=0 or pagination=false to skip
  // /////////////////////////////////////
  if (args.limit !== 0 && args.pagination) {
    return Model.paginate(query, args);
  }

  const docs = await Model.find(query, undefined, args);

  return {
    docs,
    totalDocs: docs.length,
    totalPages: 1,
    page: undefined,
    nextPage: null,
    prevPage: null,
    pagingCounter: 0,
    hasNextPage: null,
    hasPrevPage: null,
    limit: args.limit || null,
  };
}
