import { PayloadRequest } from '../../express/types';

async function init(args: { req: PayloadRequest, collection: string }): Promise<boolean> {
  const {
    req: { payload },
    collection: slug,
  } = args;

  const { docs } = await payload.db.find({
    collection: slug,
    limit: 1,
    pagination: false,
  });

  return docs.length === 1;
}

export default init;
