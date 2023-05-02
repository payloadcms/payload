import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { PaginatedDocs } from '../../mongoose/types';
import flattenWhereConstraints from '../../utilities/flattenWhereConstraints';
import { buildSortParam } from '../../mongoose/buildSortParam';
import { SanitizedGlobalConfig } from '../config/types';
import { afterRead } from '../../fields/hooks/afterRead';
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields';
import { TypeWithVersion } from '../../versions/types';

export type Arguments = {
  globalConfig: SanitizedGlobalConfig
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
    globalConfig,
    req,
    req: {
      locale,
      payload,
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  const VersionsModel = payload.versions[globalConfig.slug];

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  let useEstimatedCount = false;

  if (where) {
    const constraints = flattenWhereConstraints(where);
    useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  const accessResults = !overrideAccess ? await executeAccess({ req }, globalConfig.access.readVersions) : true;

  const query = await VersionsModel.buildQuery({
    where,
    access: accessResults,
    req,
    overrideAccess,
    globalSlug: globalConfig.slug,
  });

  // /////////////////////////////////////
  // Find
  // /////////////////////////////////////

  const [sortProperty, sortOrder] = buildSortParam({
    sort: args.sort || '-updatedAt',
    fields: buildVersionGlobalFields(globalConfig),
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
  // afterRead - Fields
  // /////////////////////////////////////

  let result = {
    ...paginatedDocs,
    docs: await Promise.all(paginatedDocs.docs.map(async (data) => ({
      ...data,
      version: await afterRead({
        depth,
        doc: data.version,
        entityConfig: globalConfig,
        req,
        overrideAccess,
        showHiddenFields,
        findMany: true,
      }),
    }))),
  } as PaginatedDocs<T>;

  // /////////////////////////////////////
  // afterRead - Global
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      const docRef = doc;

      await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
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
