const destroy = async ({ id, model }) => {
  try {
    // Await pre-hook here

    const result = await model.findOneAndDelete({ _id: id });

    // Await post hook here

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = destroy;
