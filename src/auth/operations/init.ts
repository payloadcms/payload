import { Collection } from '../../collections/config/types';

async function init(args: Collection): Promise<boolean> {
  const {
    Model,
  } = args;

  const count = await Model.countDocuments({});

  if (count >= 1) return true;

  return false;
}

export default init;
