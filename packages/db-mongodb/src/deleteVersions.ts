import type { MongooseAdapter } from '.';
import type { DeleteVersions } from '../../types';
import { withSession } from './withSession';
import { PayloadRequest } from '../../../express/types';

export const deleteVersions: DeleteVersions = async function deleteVersions(this: MongooseAdapter,
  { collection, where, locale, req = {} as PayloadRequest }) {
  const VersionsModel = this.versions[collection];
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
  };

  const query = await VersionsModel.buildQuery({
    payload: this.payload,
    locale,
    where,
  });

  await VersionsModel.deleteMany(query, options);
};
