import { CollectionModel } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
import { sendEvent } from '../../utilities/telemetry/telemetry';

async function init(args: { Model: CollectionModel, req: PayloadRequest }): Promise<boolean> {
  const {
    Model,
    req,
  } = args;

  await sendEvent({ req });

  const count = await Model.countDocuments({});

  return count >= 1;
}

export default init;
