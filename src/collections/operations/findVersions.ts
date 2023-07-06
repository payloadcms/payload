import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { Collection } from '../config/types';
import { buildSortParam } from '../../mongoose/queries/buildSortParam';
import { TypeWithVersion } from '../../versions/types';
import { afterRead } from '../../fields/hooks/afterRead';
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths';
import { combineQueries } from '../../database/combineQueries';
import { PaginatedDocs } from '../../database/types';

export type Arguments = {
  collection: Collection
  where?: Where
  page?: number
  limit?: number
  sort?: string
  depth?: number
  req?: PayloadRequest
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function findVersions<T extends TypeWithVersion<T>>(
  args: Arguments,
): Promise<PaginatedDocs<T>> {
  const {
    where,
    page,
    limit,
    depth,
    collection: {
      config: collectionConfig,
    },
    sort,
    req,
    req: {
      locale,
      payload,
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  let accessResults;

  if (!overrideAccess) {
    accessResults = await executeAccess({ req }, collectionConfig.access.readVersions);
  }

  const versionFields = buildVersionCollectionFields(collectionConfig);

  await validateQueryPaths({
    collectionConfig,
    versionFields,
    where,
    req,
    overrideAccess,
  });

  const fullWhere = combineQueries(where, accessResults);

  // /////////////////////////////////////
  // Find
  // /////////////////////////////////////

  const paginatedDocs = await payload.db.findVersions<T>({
    where: fullWhere,
    page: page || 1,
    limit: limit ?? 10,
    collection: collectionConfig.slug,
    sort,
    locale,
  });

  // /////////////////////////////////////
  // beforeRead - Collection
  // /////////////////////////////////////

  let result = {
    ...paginatedDocs,
    docs: await Promise.all(paginatedDocs.docs.map(async (doc) => {
      const docRef = doc;
      await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
        await priorHook;

        docRef.version = await hook({ req, query: fullWhere, doc: docRef.version }) || docRef.version;
      }, Promise.resolve());

      return docRef;
    })),
  } as PaginatedDocs<T>;

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (data) => ({
      ...data,
      version: await afterRead({
        depth,
        doc: data.version,
        entityConfig: collectionConfig,
        overrideAccess,
        req,
        showHiddenFields,
        findMany: true,
      }),
    }))),
  };

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      const docRef = doc;

      await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;

        docRef.version = await hook({ req, query: fullWhere, doc: doc.version, findMany: true }) || doc.version;
      }, Promise.resolve());

      return docRef;
    })),
  };

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  result = {
    ...result,
    docs: result.docs.map((doc) => sanitizeInternalFields<T>(doc)),
  };

  return result;
}

export default findVersions;
