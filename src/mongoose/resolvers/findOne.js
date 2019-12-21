const find = ({ Model, locale, fallback }) => {
  return new Promise((resolve, reject) => {
    Model.findOne(null, (err, doc) => {
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
