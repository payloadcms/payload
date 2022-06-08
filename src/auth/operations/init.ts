import { CollectionModel } from '../../collections/config/types';

async function init(args: { Model: CollectionModel }): Promise<boolean> {
  const {
    Model,
  } = args;

  const count = await Model.countDocuments({});

  return count >= 1;
}

export default init;
