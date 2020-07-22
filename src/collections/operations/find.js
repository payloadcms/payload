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
      and: [where],
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
  // 2. Execute before collection hook
  // /////////////////////////////////////

  collectionConfig.hooks.beforeRead.forEach((hook) => hook({ req, query }));

  // /////////////////////////////////////
  // 3. Perform database operation
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
  // 4. Execute field-level access
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      if (locale && doc.setLocale) {
        doc.setLocale(locale, fallbackLocale);
      }

      const data = doc.toJSON({ virtuals: true });

      return this.performFieldOperations(
        collectionConfig,
        {
          depth,
          data,
          req,
          hook: 'afterRead',
          operationName: 'read',
          overrideAccess,
        },
        find,
      );
    })),
  };

  // /////////////////////////////////////
  // 6. Execute afterRead collection hook
  // /////////////////////////////////////

  let afterReadResult = result;

  if (typeof afterRead === 'function') {
    afterReadResult = {
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
  }

  // /////////////////////////////////////
  // 7. Return results
  // /////////////////////////////////////

  return afterReadResult;
}

module.exports = find;
