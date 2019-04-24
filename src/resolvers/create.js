
const create = query => {
  console.log(query);
  return new Promise((resolve, reject) => {
    query.model.create(query.input, (err, doc) => {
      if (err || !doc) {
        return reject({message: 'not found'})
      }
      let result = doc;
      resolve(result);
    });
  });
};

export default create;
