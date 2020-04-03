const create = async (options) => {
  try {
    // Await validation here

    // Await pre-hook here

    const doc = await options.Model.create(options.data);

    // Await post hook here

    return doc.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = create;
