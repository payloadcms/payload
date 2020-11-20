async function init(args) {
  const {
    Model,
  } = args;

  const count = await Model.countDocuments({});

  if (count >= 1) return true;

  return false;
}

export default init;
