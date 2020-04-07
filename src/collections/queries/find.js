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

    const mongooseOptions = {
      options: {},
    };

    if (paginate.page) mongooseOptions.page = paginate.page;
    if (paginate.limit) mongooseOptions.limit = paginate.limit;
    if (paginate.sort) mongooseOptions.sort = paginate.sort;

    if (depth && depth !== '0') {
      mongooseOptions.options.autopopulate = {
        maxDepth: parseInt(depth, 10),
      };
    } else {
      mongooseOptions.options.autopopulate = false;
    }

    const result = await model.paginate(mongooseQuery, mongooseOptions);

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
