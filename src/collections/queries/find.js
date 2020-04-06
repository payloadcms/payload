const { APIError } = require('../../errors');

const find = async (options) => {
  try {
    const {
      model,
      query = {},
      locale,
      fallbackLocale,
      paginate = {},
      depth,
    } = options;

    // await pre find hook here

    const mongooseQuery = await model.buildQuery(query, locale);

    const paginateQuery = {
      options: {},
    };

    if (paginate.page) paginateQuery.page = paginate.page;
    if (paginate.limit) paginateQuery.limit = paginate.limit;
    if (paginate.sort) paginateQuery.sort = paginate.sort;

    if (depth) {
      paginateQuery.options.autopopulate = {
        maxDepth: depth,
      };
    }

    model.setDefaultLocale(locale);

    const result = await model.paginate(mongooseQuery, paginateQuery);

    // await post find hook here

    return {
      ...result,
      docs: result.docs.map((doc) => {
        if (locale && doc.setLocale) {
          doc.setLocale(locale, fallbackLocale);
        }

        return doc.toJSON({ virtuals: true });
      }),
    };
  } catch (err) {
    throw new APIError();
  }
};

module.exports = find;
