const update = async (options) => {
  try {
    const {
      id,
      model,
      data,
    } = options;
    // Await validation here

    // Await pre-hook here

    const doc = await model.findOne({ _id: id });
    Object.assign(doc, data);
    await doc.save();

    // Await post hook here

    return doc.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = update;
