const mongoose = require('mongoose');
const { NotFound } = require('../../errors');

const findByID = async (options) => {
  const mongooseOptions = {
    options: {},
  };

  const {
    depth, locale, fallbackLocale, model, id,
  } = options;

  const hasMultipleIDs = Array.isArray(id);

  if (depth && depth !== '0') {
    mongooseOptions.options.autopopulate = {
      maxDepth: parseInt(depth, 10),
    };
  } else {
    mongooseOptions.options.autopopulate = false;
  }

  let result;

  try {
    // Await pre find hook here

    if (hasMultipleIDs) {
      result = await model.find({
        _id: {
          $in: id.map(docId => mongoose.Types.ObjectId(docId)),
        },
      }, {}, mongooseOptions);
    } else {
      result = await model.findOne({ _id: id }, {}, mongooseOptions);
    }

    if (!result || (result && result.length === 0)) throw new NotFound();

    if (hasMultipleIDs) {
      return result.map((doc) => {
        if (locale && doc.setLocale) doc.setLocale(locale, fallbackLocale);
        return doc.toJSON({ virtuals: true });
      });
    }

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    // Await post find hook here

    return result.toJSON({ virtuals: true });
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
