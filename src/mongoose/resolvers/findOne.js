import { NotFound } from '../../errors';

const find = ({
  Model, locale, fallback, depth,
}) => {
  const options = {};

  if (depth) {
    options.autopopulate = {
      maxDepth: depth,
    };
  }

const find = ({ Model, locale, fallback }) => {
  return new Promise((resolve, reject) => {
    Model.findOne(null, null, options, (err, doc) => {
      if (err || !doc) {
        reject(new NotFound());
        return;
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
