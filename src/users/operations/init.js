const init = async (args) => {
  try {
    const {
      Model,
    } = args;

    const count = await Model.countDocuments({});

    if (count >= 1) return true;

    return false;
  } catch (error) {
    throw error;
  }
};

module.exports = init;
