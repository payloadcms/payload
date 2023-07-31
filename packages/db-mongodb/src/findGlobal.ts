import { combineQueries } from 'payload/dist/database/combineQueries';
import type { FindGlobal } from 'payload/dist/database/types';
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields';
import { PayloadRequest } from 'payload/dist/express/types';
import type { MongooseAdapter } from '.';
import { withSession } from './withSession';

export const findGlobal: FindGlobal = async function findGlobal(
  this: MongooseAdapter,
  { slug, locale, where, req = {} as PayloadRequest },
) {
  const Model = this.globals;
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
  };

  const query = await Model.buildQuery({
    where: combineQueries({ globalType: { equals: slug } }, where),
    payload: this.payload,
    locale,
    globalSlug: slug,
  });

  let doc = (await Model.findOne(query, {}, options)) as any;

  if (!doc) {
    return null;
  }
  if (doc._id) {
    doc.id = doc._id;
    delete doc._id;
  }

  doc = JSON.parse(JSON.stringify(doc));
  doc = sanitizeInternalFields(doc);

  return doc;
};
