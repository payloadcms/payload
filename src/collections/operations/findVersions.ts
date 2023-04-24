import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { Collection, CollectionModel } from '../config/types';
import { hasWhereAccessResult } from '../../auth/types';
import flattenWhereConstraints from '../../utilities/flattenWhereConstraints';
import { buildSortParam } from '../../mongoose/buildSortParam';
import { PaginatedDocs } from '../../mongoose/types';
import { TypeWithVersion } from '../../versions/types';
import { afterRead } from '../../fields/hooks/afterRead';
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields';

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
    req,
    req: {
      locale,
      payload,
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  const VersionsModel = payload.versions[collectionConfig.slug] as CollectionModel;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  let queryToBuild: Where = {};
  let useEstimatedCount = false;

  if (where) {
    let and = [];

    if (Array.isArray(where.and)) and = where.and;
    if (Array.isArray(where.AND)) and = where.AND;

    queryToBuild = {
      ...where,
      and: [
        ...and,
      ],
    };

    const constraints = flattenWhereConstraints(queryToBuild);

    useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  if (!overrideAccess) {
    const accessResults = await executeAccess({ req }, collectionConfig.access.readVersions);

    if (hasWhereAccessResult(accessResults)) {
      if (!where) {
        queryToBuild = {
          and: [
            accessResults,
          ],
        };
      } else {
        queryToBuild.and.push(accessResults);
      }
    }
  }

  const query = await VersionsModel.buildQuery({
    where: queryToBuild,
    req,
    overrideAccess,
  });

  // /////////////////////////////////////
  // Find
  // /////////////////////////////////////

  const [sortProperty, sortOrder] = buildSortParam({
    sort: args.sort || '-updatedAt',
    fields: buildVersionCollectionFields(collectionConfig),
    timestamps: true,
    config: payload.config,
    locale,
  });

  const paginatedDocs = await VersionsModel.paginate(query, {
    page: page || 1,
    limit: limit ?? 10,
    sort: {
      [sortProperty]: sortOrder,
    },
    lean: true,
    leanWithId: true,
    useEstimatedCount,
  });

  // /////////////////////////////////////
  // beforeRead - Collection
  // /////////////////////////////////////

  let result = {
    ...paginatedDocs,
    docs: await Promise.all(paginatedDocs.docs.map(async (doc) => {
      const docString = JSON.stringify(doc);
      const docRef = JSON.parse(docString);

      await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
        await priorHook;

        docRef.version = await hook({ req, query, doc: docRef.version }) || docRef.version;
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

        docRef.version = await hook({ req, query, doc: doc.version, findMany: true }) || doc.version;
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
