import { PayloadRequest } from '../../express/types';

async function init(args: { req: PayloadRequest, collection: string }): Promise<boolean> {
  const {
    req: { payload },
    collection: slug,
  } = args;

  const collection = payload.collections[slug].config;

  const { docs } = await payload.db.find({
    payload,
    collection,
    limit: 1,
    pagination: false,
  });

  return docs.length === 1;
}

export default init;
