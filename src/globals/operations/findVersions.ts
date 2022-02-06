import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { PaginatedDocs } from '../../mongoose/types';
import { hasWhereAccessResult } from '../../auth/types';
import flattenWhereConstraints from '../../utilities/flattenWhereConstraints';
import { buildSortParam } from '../../mongoose/buildSortParam';
import { TypeWithVersion } from '../../versions/types';
import { SanitizedGlobalConfig } from '../config/types';

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

async function findVersions<T extends TypeWithVersion<T> = any>(args: Arguments): Promise<PaginatedDocs<T>> {
  const {
    where,
    page,
    limit,
    depth,
    globalConfig,
    req,
    req: {
      locale,
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  const VersionsModel = this.versions[globalConfig.slug];

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const queryToBuild: { where?: Where} = {};
  let useEstimatedCount = false;

  if (where) {
    let and = [];

    if (Array.isArray(where.and)) and = where.and;
    if (Array.isArray(where.AND)) and = where.AND;

    queryToBuild.where = {
      ...where,
      and: [
        ...and,
      ],
    };

    const constraints = flattenWhereConstraints(queryToBuild);

    useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
  }

  if (!overrideAccess) {
    const accessResults = await executeAccess({ req }, globalConfig.access.readVersions);

    if (hasWhereAccessResult(accessResults)) {
      if (!where) {
        queryToBuild.where = {
          and: [
            accessResults,
          ],
        };
      } else {
        (queryToBuild.where.and as Where[]).push(accessResults);
      }
    }
  }

  const query = await VersionsModel.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // Find
  // /////////////////////////////////////

  const [sortProperty, sortOrder] = buildSortParam(args.sort || '-updatedAt', true);

  const optionsToExecute = {
    page: page || 1,
    limit: limit || 10,
    sort: {
      [sortProperty]: sortOrder,
    },
    lean: true,
    leanWithId: true,
    useEstimatedCount,
  };

  const paginatedDocs = await VersionsModel.paginate(query, optionsToExecute);

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  let result = {
    ...paginatedDocs,
    docs: await Promise.all(paginatedDocs.docs.map(async (data) => ({
      ...data,
      version: await this.performFieldOperations(
        globalConfig,
        {
          depth,
          data: data.version,
          req,
          id: data.version.id,
          hook: 'afterRead',
          operation: 'read',
          overrideAccess,
          flattenLocales: true,
          showHiddenFields,
          isVersion: true,
        },
      ),
    }))),
  };

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      const docRef = doc;

      await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;

        docRef.version = await hook({ req, query, doc: doc.version }) || doc.version;
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
