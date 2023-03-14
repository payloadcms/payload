import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { Collection, TypeWithID } from '../config/types';
import { PaginatedDocs } from '../../mongoose/types';
import { hasWhereAccessResult } from '../../auth/types';
import flattenWhereConstraints from '../../utilities/flattenWhereConstraints';
import { buildSortParam } from '../../mongoose/buildSortParam';
import { AccessResult } from '../../config/types';
import { afterRead } from '../../fields/hooks/afterRead';
import { queryDrafts } from '../../versions/drafts/queryDrafts';

export type Arguments = {
  collection: Collection
  where?: Where
  page?: number
  limit?: number
  sort?: string
  depth?: number
  currentDepth?: number
  req?: PayloadRequest
  overrideAccess?: boolean
  disableErrors?: boolean
  pagination?: boolean
  showHiddenFields?: boolean
  queryHiddenFields?: boolean
  draft?: boolean
}

async function find<T extends TypeWithID & Record<string, unknown>>(
  incomingArgs: Arguments,
): Promise<PaginatedDocs<T>> {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'read',
    })) || args;
  }, Promise.resolve());

  const {
    where,
    page,
    limit,
    depth,
    currentDepth,
    draft: draftsEnabled,
    collection,
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    req: {
      locale,
      payload,
    },
    overrideAccess,
    disableErrors,
    showHiddenFields,
    queryHiddenFields,
    pagination = true,
  } = args;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const queryToBuild: { where?: Where } = {
    where: {
      and: [],
    },
  };

  let useEstimatedCount = false;

  if (where) {
    queryToBuild.where = {
      and: [],
      ...where,
    };

    if (Array.isArray(where.AND)) {
      queryToBuild.where.and = [
        ...queryToBuild.where.and,
        ...where.AND,
      ];
    }

    const constraints = flattenWhereConstraints(queryToBuild);

    useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  let accessResult: AccessResult;

  if (!overrideAccess) {
    accessResult = await executeAccess({ req, disableErrors }, collectionConfig.access.read);

    // If errors are disabled, and access returns false, return empty results
    if (accessResult === false) {
      return {
        docs: [],
        totalDocs: 0,
        totalPages: 1,
        page: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
        limit,
      };
    }

    if (hasWhereAccessResult(accessResult)) {
      queryToBuild.where.and.push(accessResult);
    }
  }

  const query = await Model.buildQuery(queryToBuild, locale, queryHiddenFields);

  // /////////////////////////////////////
  // Find
  // /////////////////////////////////////

  const [sortProperty, sortOrder] = buildSortParam({
    sort: args.sort,
    config: payload.config,
    fields: collectionConfig.fields,
    timestamps: collectionConfig.timestamps,
    locale,
  });

  const usePagination = pagination && limit !== 0;
  const limitToUse = limit ?? (usePagination ? 10 : 0);

  let result: PaginatedDocs<T>;

  const paginationOptions = {
    page: page || 1,
    sort: {
      [sortProperty]: sortOrder,
    },
    limit: limitToUse,
    lean: true,
    leanWithId: true,
    useEstimatedCount,
    pagination: usePagination,
    useCustomCountFn: pagination ? undefined : () => Promise.resolve(1),
    options: {
      // limit must also be set here, it's ignored when pagination is false
      limit: limitToUse,
    },
  };

  if (collectionConfig.versions?.drafts && draftsEnabled) {
    result = await queryDrafts<T>({
      accessResult,
      collection,
      locale,
      paginationOptions,
      payload,
      where,
    });
  } else {
    result = await Model.paginate(query, paginationOptions);
  }

  result = {
    ...result,
    docs: result.docs.map((doc) => {
      const sanitizedDoc = JSON.parse(JSON.stringify(doc));
      sanitizedDoc.id = sanitizedDoc._id;
      return sanitizeInternalFields(sanitizedDoc);
    }),
  };

  // /////////////////////////////////////
  // beforeRead - Collection
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      let docRef = doc;

      await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
        await priorHook;

        docRef = await hook({ req, query, doc: docRef }) || docRef;
      }, Promise.resolve());

      return docRef;
    })),
  };

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => afterRead<T>({
      depth,
      currentDepth,
      doc,
      entityConfig: collectionConfig,
      overrideAccess,
      req,
      showHiddenFields,
      findMany: true,
    }))),
  };

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      let docRef = doc;

      await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;

        docRef = await hook({ req, query, doc: docRef, findMany: true }) || doc;
      }, Promise.resolve());

      return docRef;
    })),
  };

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default find;
