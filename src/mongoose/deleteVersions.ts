import type { MongooseAdapter } from '.';
import type { DeleteVersions } from '../database/types';
import { withSession } from './withSession';

export const deleteVersions: DeleteVersions = async function deleteVersions(this: MongooseAdapter,
  { collection, where, locale, transactionID }) {
  const VersionsModel = this.versions[collection];
  const options = {
    ...withSession(this, transactionID),
    lean: true,
  };

  const query = await VersionsModel.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  await VersionsModel.deleteMany(query, options);
};
