const convertArrayToObject = (arr, key) => {
  return arr.reduce((obj, item) => {
    if (key) {
      obj[item[key]] = item;
      return obj;
    }

    obj[item] = {};
    return obj;
  }, {});
};

const convertObjectToArray = (arr) => {
  return Object.values(arr);
};

const convertArrayToHash = (arr, key) => {
  return arr.reduce((obj, item, i) => {
    obj[item[key]] = i;
    return obj;
  }, {});
};

module.exports = {
  convertArrayToHash,
  convertObjectToArray,
  convertArrayToObject,
};
