import { Where } from '../../types';
import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { Collection, TypeWithID } from '../config/types';
import { PaginatedDocs } from '../../mongoose/types';
import { hasWhereAccessResult } from '../../auth/types';
import flattenWhereConstraints from '../../utilities/flattenWhereConstraints';
import { buildSortParam } from '../../mongoose/buildSortParam';
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable';
import { AccessResult } from '../../config/types';

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
  draft?: boolean
}

async function find<T extends TypeWithID = any>(incomingArgs: Arguments): Promise<PaginatedDocs<T>> {
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
    draft: draftsEnabled,
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    req: {
      locale,
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const queryToBuild: { where?: Where} = {
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
    accessResult = await executeAccess({ req }, collectionConfig.access.read);

    if (hasWhereAccessResult(accessResult)) {
      queryToBuild.where.and.push(accessResult);
    }
  }

  if (collectionConfig.versions?.drafts && !draftsEnabled) {
    queryToBuild.where.and.push({
      or: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          _status: {
            exists: false,
          },
        },
      ],
    });
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // Find
  // /////////////////////////////////////
  const [sortProperty, sortOrder] = buildSortParam(args.sort, collectionConfig.timestamps);

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

  const paginatedDocs = await Model.paginate(query, optionsToExecute);

  let result = {
    ...paginatedDocs,
  } as PaginatedDocs<T>;

  // /////////////////////////////////////
  // Replace documents with drafts if available
  // /////////////////////////////////////

  if (collectionConfig.versions?.drafts && draftsEnabled) {
    result = {
      ...result,
      docs: await Promise.all(result.docs.map(async (doc) => replaceWithDraftIfAvailable({
        accessResult,
        payload: this,
        entity: collectionConfig,
        doc,
        locale,
      }))),
    };
  }

  // /////////////////////////////////////
  // beforeRead - Collection
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      const docString = JSON.stringify(doc);
      let docRef = JSON.parse(docString);

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
    docs: await Promise.all(result.docs.map(async (data) => this.performFieldOperations(
      collectionConfig,
      {
        depth,
        data,
        req,
        id: data.id,
        hook: 'afterRead',
        operation: 'read',
        overrideAccess,
        flattenLocales: true,
        showHiddenFields,
      },
    ))),
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

        docRef = await hook({ req, query, doc }) || doc;
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

export default find;
