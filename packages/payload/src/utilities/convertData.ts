/* eslint-disable no-param-reassign */
const convertArrayToObject = (arr, key) => arr.reduce((obj, item) => {
  if (key) {
    obj[item[key]] = item;
    return obj;
  }

  obj[item] = {};
  return obj;
}, {});

const convertObjectToArray = (arr) => Object.values(arr);

const convertArrayToHash = (arr, key) => arr.reduce((obj, item, i) => {
  obj[item[key]] = i;
  return obj;
}, {});

export {
  convertArrayToHash,
  convertObjectToArray,
  convertArrayToObject,
};
