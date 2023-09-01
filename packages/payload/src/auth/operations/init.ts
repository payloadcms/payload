import type { PayloadRequest } from '../../express/types';

async function init(args: { collection: string, req: PayloadRequest }): Promise<boolean> {
  const {
    collection: slug,
    req: { payload },
  } = args;

  const doc = await payload.db.findOne({
    collection: slug,
  });

  return !!doc;
}

export default init;
