const mongoose = require('mongoose');
const { NotFound } = require('../../errors');

const findByID = async (options) => {
  const mongooseOptions = {};
  const {
    depth, locale, fallbackLocale, model, id,
  } = options;

  const hasMultipleIDs = Array.isArray(id);

  if (depth) {
    mongooseOptions.autopopulate = {
      maxDepth: depth,
    };
  }

  try {
    // Await pre find hook here

    let result;

    if (hasMultipleIDs) {
      result = await model.find({
        _id: {
          $in: id.map(id => mongoose.Types.ObjectId(id)),
        },
      }, {}, mongooseOptions);
    } else {
      result = await model.findOne({ _id: id }, {}, mongooseOptions);
    }

    if (result.length === 0) throw new NotFound();

    if (hasMultipleIDs) {
      result = result.map((doc) => {
        if (locale && doc.setLocale) doc.setLocale(locale, fallbackLocale);
        return doc.toJSON({ virtuals: true });
      });
    } else if (locale && result.setLocale) result = result.setLocale(locale, fallbackLocale);

    // Await post find hook here

    return result.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
