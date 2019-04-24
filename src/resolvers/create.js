
const create = query => {
  return new Promise((resolve, reject) => {
    query.Model.create(query.input, (err, doc) => {
      console.log(err,doc);
      if (err || !doc) {
        return reject({message: err})
      }
      resolve(doc);
    });
  });
};

export default create;
