import {paramParser} from './paramParser';

export default function apiQueryPlugin(schema) {

  schema.statics.apiQuery = function (rawParams, cb) {
    const model = this;
    const params = paramParser(this, rawParams);

    // Create the Mongoose Query object.
    let query = model
      .find(params.searchParams)
      .limit(params.per_page)
      .skip((params.page - 1) * params.per_page);

    if (params.sort)
      query = query.sort(params.sort);

    if (cb) {
      query.exec(cb);
    } else {
      return query;
    }
  };
}
