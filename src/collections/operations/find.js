const executeAccess = require('../../auth/executeAccess');

async function find(args) {
  const {
    where,
    page,
    limit,
    depth,
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    req: {
      locale,
      fallbackLocale,
    },
    overrideAccess,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const queryToBuild = {};

  if (where) {
    queryToBuild.where = {
      ...where,
      and: [
        ...(Array.isArray(where.and) ? where.and : []),
      ],
    };
  }

  if (!overrideAccess) {
    const accessResults = await executeAccess({ req }, collectionConfig.access.read);
    const hasWhereAccess = typeof accessResults === 'object';

    if (hasWhereAccess) {
      if (!where) {
        queryToBuild.where = {
          and: [
            accessResults,
          ],
        };
      } else {
        queryToBuild.where.and.push(accessResults);
      }
    }
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // 2. Perform database operation
  // /////////////////////////////////////

  let { sort } = args;

  if (!sort) {
    if (collectionConfig.timestamps) {
      sort = '-createdAt';
    } else {
      sort = '-_id';
    }
  }

  const optionsToExecute = {
    page: page || 1,
    limit: limit || 10,
    sort,
    collation: sort ? { locale: 'en' } : {}, // case-insensitive sort in MongoDB
  };

  let result = await Model.paginate(query, optionsToExecute);

  // /////////////////////////////////////
  // 3. Execute beforeRead collection hook
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      let docRef = doc;

      if (locale && doc.setLocale) {
        doc.setLocale(locale, fallbackLocale);
      }

      docRef = doc.toJSON({ virtuals: true });

      await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
        await priorHook;

        docRef = await hook({ req, query, doc: docRef }) || docRef;
      }, Promise.resolve());

      return docRef;
    })),
  };

  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
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
      },
      find,
    ))),
  };

  // /////////////////////////////////////
  // 5. Execute afterRead collection hook
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
  // 6. Return results
  // /////////////////////////////////////

  result = JSON.stringify(result);
  result = JSON.parse(result);

  return result;
}

module.exports = find;
