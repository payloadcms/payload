import { PayloadRequest } from '../../express/types';

async function init(args: { req: PayloadRequest, collection: string }): Promise<boolean> {
  const {
    req: { payload },
    collection: slug,
  } = args;

  const doc = await payload.db.findOne({
    collection: slug,
  });

  return !!doc;
}

export default init;
