const find = ({
  Model, locale, fallback, depth,
}) => {
  const options = {};

  if (depth) {
    options.autopopulate = {
      maxDepth: depth,
    };
  }

  return new Promise((resolve, reject) => {
    Model.findOne(null, null, options, (err, doc) => {
      if (err || !doc) {
        return reject({ message: 'not found' });
      }

      let result = doc;

      if (locale) {
        doc.setLocale(locale, fallback);
        const json = doc.toJSON({ virtuals: true });
        result = json;
      }

      resolve(result);
    });
  });
};

export default find;
