import type { MongooseAdapter } from '.';
import type { DeleteVersions } from '../database/types';

export const deleteVersions: DeleteVersions = async function deleteVersions(this: MongooseAdapter,
  { collection, where, locale }) {
  const VersionsModel = this.versions[collection];


  const query = await VersionsModel.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  await VersionsModel.deleteMany(query).lean();
};
