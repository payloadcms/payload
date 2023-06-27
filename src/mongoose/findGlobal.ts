import type { MongooseAdapter } from '.';
import { combineQueries } from '../database/combineQueries';
import type { FindGlobal } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

export const findGlobal: FindGlobal = async function findGlobal(this: MongooseAdapter,
  { slug, locale, where }) {
  const Model = this.globals;

  const query = await Model.buildQuery({
    where: combineQueries({ globalType: { equals: slug } }, where),
    payload: this.payload,
    locale,
    globalSlug: slug,
  });

  let doc = await Model.findOne(query).lean() as any;

  if (!doc) {
    doc = {};
  } else if (doc._id) {
    doc.id = doc._id;
    delete doc._id;
  }

  doc = JSON.parse(JSON.stringify(doc));
  doc = sanitizeInternalFields(doc);


  return doc;
};
