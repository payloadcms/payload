import NotFound from '../../errors';

const find = ({ Model, locale, fallback }) => {
  return new Promise((resolve, reject) => {
    Model.findOne(null, (err, doc) => {
      if (err || !doc) {
        console.log('ok');
        reject(new NotFound());
      }

      let result = doc;

      if (locale) {
        doc.setLocale(locale, fallback);
        result = doc.toJSON({ virtuals: true });
      }

      resolve(result);
    });
  });
};

export default find;
