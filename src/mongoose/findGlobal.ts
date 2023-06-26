import type { MongooseAdapter } from '.';
import { FindGlobalArgs } from '../database/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import { TypeWithID } from '../globals/config/types';

export async function findGlobal<T extends TypeWithID = any>(
  this: MongooseAdapter,
  { slug, locale, where }: FindGlobalArgs,
): Promise<T> {
  const Model = this.globals;

  const query = await Model.buildQuery({
    where,
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
}
